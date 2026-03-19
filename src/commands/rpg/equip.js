const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const itemsData = require('../../utils/itemsData');

module.exports = {
    category: 'Economy',
    aliases: ['eq', 'wear'],
    data: new SlashCommandBuilder()
        .setName('equip')
        .setDescription('Mặc hoặc tháo trang bị')
        .addStringOption(option => 
            option.setName('item_id')
                .setDescription('ID của trang bị muốn mặc (Nhập ID để mặc/tháo)')
                .setRequired(true)
        ),
    help: {
        usage: '/equip <item_id>',
        examples: ['/equip 16', '$eq 5'],
        description: 'Mặc một món đồ từ túi lên người hoặc tháo món đồ đang mặc ra. Bạn có thể dùng Mã Số (ví dụ: 16) hoặc Tên ID (ví dụ: warrior_blade).'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        let itemId = interaction.options.getString('item_id');

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: require('discord.js').MessageFlags.Ephemeral });

        // Check if item exists in game
        const itemInfo = itemsData.getItem(itemId);
        if (!itemInfo) {
            return interaction.reply({ content: `❌ Trang bị \`${itemId}\` không tồn tại trong thế giới này.`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        // Normalize numeric code to string ID for DB queries
        itemId = itemInfo.id;

        // Check if player owns the item
        const inventoryRow = await db.queryOne('SELECT * FROM inventory WHERE user_id = $1 AND item_id = $2 AND amount > 0', [userId, itemId]);
        
        // Also check if they already have it equipped
        const currentEquip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const isEquipped = currentEquip && (currentEquip.weapon_id === itemId || currentEquip.armor_id === itemId || currentEquip.accessory_id === itemId);

        if (!inventoryRow && !isEquipped) {
            return interaction.reply({ content: `❌ Bạn không sở hữu trang bị \`${itemInfo.name}\`.`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        // Initialize equipment row if not exists
        if (!currentEquip) {
            await db.execute('INSERT INTO player_equipment (user_id) VALUES ($1)', [userId]);
        }

        const equipState = currentEquip || { weapon_id: null, armor_id: null, accessory_id: null };
        let action = '';

        // Handle Equip / Unequip Toggle
        if (isEquipped) {
            // Unequip
            if (equipState.weapon_id === itemId) await db.execute('UPDATE player_equipment SET weapon_id = NULL WHERE user_id = $1', [userId]);
            if (equipState.armor_id === itemId) await db.execute('UPDATE player_equipment SET armor_id = NULL WHERE user_id = $1', [userId]);
            if (equipState.accessory_id === itemId) await db.execute('UPDATE player_equipment SET accessory_id = NULL WHERE user_id = $1', [userId]);
            action = 'Tháo';
        } else {
            // Equip
            if (itemInfo.requiredClass) {
                const required = Array.isArray(itemInfo.requiredClass) ? itemInfo.requiredClass : [itemInfo.requiredClass];
                if (!required.includes(player.class)) {
                    return interaction.reply({ 
                        content: `❌ Chức nghiệp **${player.class}** không thể sử dụng **${itemInfo.name}**. (Yêu cầu: ${required.join(', ')})`, 
                        flags: require('discord.js').MessageFlags.Ephemeral 
                    });
                }
            }

            if (itemInfo.type === 'weapon') {
                await db.execute('UPDATE player_equipment SET weapon_id = $1 WHERE user_id = $2', [itemId, userId]);
            } else if (itemInfo.type === 'armor') {
                await db.execute('UPDATE player_equipment SET armor_id = $1 WHERE user_id = $2', [itemId, userId]);
            } else if (itemInfo.type === 'accessory') {
                await db.execute('UPDATE player_equipment SET accessory_id = $1 WHERE user_id = $2', [itemId, userId]);
            }
            action = 'Mặc';
        }

        // Recalculate Stats
        await recalculateStats(userId);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setDescription(`🛡️ Đã **${action}** thành công trang bị: **${itemInfo.name}** [${itemInfo.rarity}]`);
        
        await interaction.reply({ embeds: [embed] });
    }
};

async function recalculateStats(userId) {
    const player = await db.getPlayer(userId);
    const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
    
    // Base stats from level and class
    const level = player.level || 1;
    let baseAtk = 10 + (level * 2);
    let baseDef = 10 + (level * 2);
    let baseAgi = 10 + level;
    let baseCrit = 0.05;

    // Apply class modifiers
    if (player.class === 'Warrior') { baseAtk += 5; baseDef += 5; }
    if (player.class === 'Ranger') { baseAtk += 2; baseAgi += 5; }
    if (player.class === 'Mage') { baseAtk += 10; baseDef -= 5; }
    if (player.class === 'Assassin') { baseAtk += 8; baseCrit += 0.05; }

    // Add equipment bonuses
    if (equip) {
        const weapon = itemsData.getItem(equip.weapon_id);
        const armor = itemsData.getItem(equip.armor_id);
        const accessory = itemsData.getItem(equip.accessory_id);

        if (weapon) {
            baseAtk += (weapon.atk || 0) + ((equip.weapon_upgrade || 0) * 10);
            baseCrit += (weapon.crit || 0) + ((equip.weapon_upgrade || 0) * 0.02);
        }
        if (armor) {
            baseDef += (armor.def || 0) + ((equip.armor_upgrade || 0) * 15);
        }
        if (accessory) {
            baseAtk += (accessory.atk || 0) + ((equip.accessory_upgrade || 0) * 5);
            baseAgi += (accessory.agi || 0) + ((equip.accessory_upgrade || 0) * 5);
            baseCrit += (accessory.crit || 0) + ((equip.accessory_upgrade || 0) * 0.01);
        }
        
        // --- PET BUFFS ---
        if (equip.pet_id) {
            const petInfo = require('../../utils/petsData').getPet(equip.pet_id);
            if (petInfo && petInfo.buffs) {
                if (petInfo.buffs.atk) baseAtk += petInfo.buffs.atk;
                if (petInfo.buffs.def) baseDef += petInfo.buffs.def;
                if (petInfo.buffs.agi) baseAgi += petInfo.buffs.agi;
                if (petInfo.buffs.crit) baseCrit += petInfo.buffs.crit;
            }
        }
    }

    // --- PASSIVE SKILLS ---
    const learnedSkills = await db.getPlayerSkills(userId);
    const skillsData = require('../../utils/skillsData');
    if (learnedSkills && learnedSkills.length > 0) {
        learnedSkills.forEach(ls => {
            const data = skillsData[player.class]?.find(s => s.id === ls.skill_id);
            if (data && data.type === 'passive') {
                // Apply bonuses (scales by level)
                if (data.def_bonus) baseDef += data.def_bonus * ls.level;
                if (data.atk_bonus) baseAtk += data.atk_bonus * ls.level;
                if (data.agi_bonus) baseAgi += data.agi_bonus * ls.level;
                if (data.crit_bonus) baseCrit += data.crit_bonus * ls.level;
                if (data.mana_bonus) {
                    // Update max_mana directly (optional, but keep it consistent)
                    // We'll just leave it as is for now or use it in stats
                }
            }
        });
    }

    // --- REBIRTH BUFFS ---
    const rebirths = player.rebirths || 0;
    if (rebirths > 0) {
        const multiplier = 1 + (rebirths * 0.10); // +10% overall stats per rebirth
        baseAtk = Math.floor(baseAtk * multiplier);
        baseDef = Math.floor(baseDef * multiplier);
        baseAgi = Math.floor(baseAgi * multiplier);
        baseCrit = Math.min(1.0, baseCrit + (rebirths * 0.01)); // +1% crit rate per rebirth
    }

    // Update in DB
    await db.execute(
        'UPDATE player_stats SET attack = $1, defense = $2, agility = $3, crit_rate = $4 WHERE user_id = $5',
        [baseAtk, baseDef, baseAgi, baseCrit, userId]
    );
}

module.exports.recalculateStats = recalculateStats;

