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
        const { MessageFlags } = require('discord.js');
        let itemId = interaction.options.getString('item_id');

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        const itemInfo = itemsData.getItem(itemId);
        if (!itemInfo) {
            return interaction.reply({ content: `❌ Trang bị \`${itemId}\` không tồn tại.`, flags: MessageFlags.Ephemeral });
        }
        itemId = itemInfo.id;

        try {
            let action = '';
            await db.withTransaction(async (client) => {
                const inventoryRow = await client.query('SELECT * FROM inventory WHERE user_id = $1 AND item_id = $2 AND amount > 0', [userId, itemId]).then(r => r.rows[0]);
                const currentEquip = await client.query('SELECT * FROM player_equipment WHERE user_id = $1', [userId]).then(r => r.rows[0]);
                
                if (!currentEquip) {
                    await client.query('INSERT INTO player_equipment (user_id) VALUES ($1)', [userId]);
                }

                const isEquipped = currentEquip && (currentEquip.weapon_id === itemId || currentEquip.armor_id === itemId || currentEquip.accessory_id === itemId);

                if (!inventoryRow && !isEquipped) {
                    throw new Error('NOT_OWNED');
                }

                if (isEquipped) {
                    if (currentEquip.weapon_id === itemId) await client.query('UPDATE player_equipment SET weapon_id = NULL WHERE user_id = $1', [userId]);
                    if (currentEquip.armor_id === itemId) await client.query('UPDATE player_equipment SET armor_id = NULL WHERE user_id = $1', [userId]);
                    if (currentEquip.accessory_id === itemId) await client.query('UPDATE player_equipment SET accessory_id = NULL WHERE user_id = $1', [userId]);
                    action = 'Tháo';
                } else {
                    if (itemInfo.requiredClass) {
                        const rec = Array.isArray(itemInfo.requiredClass) ? itemInfo.requiredClass : [itemInfo.requiredClass];
                        if (!rec.includes(player.class)) throw new Error('WRONG_CLASS');
                    }
                    if (itemInfo.type === 'weapon') await client.query('UPDATE player_equipment SET weapon_id = $1 WHERE user_id = $2', [itemId, userId]);
                    else if (itemInfo.type === 'armor') await client.query('UPDATE player_equipment SET armor_id = $1 WHERE user_id = $2', [itemId, userId]);
                    else if (itemInfo.type === 'accessory') await client.query('UPDATE player_equipment SET accessory_id = $1 WHERE user_id = $2', [itemId, userId]);
                    action = 'Mặc';
                }

                await recalculateStats(userId, client);
            });

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setDescription(`🛡️ Đã **${action}** thành công: **${itemInfo.name}**`);
            return interaction.reply({ embeds: [embed] });

        } catch (err) {
            if (err.message === 'NOT_OWNED') return interaction.reply({ content: '❌ Bạn không sở hữu món đồ này!', flags: MessageFlags.Ephemeral });
            if (err.message === 'WRONG_CLASS') return interaction.reply({ content: '❌ Sai chức nghiệp!', flags: MessageFlags.Ephemeral });
            console.error(err);
            return interaction.reply({ content: '❌ Có lỗi xảy ra khi thay đổi trang bị.', flags: MessageFlags.Ephemeral });
        }
    }
};

async function recalculateStats(userId, client = null) {
    const dbObj = client || db;
    const player = await db.getPlayer(userId); // Use pool for player to ensure fresh data or use client if needed
    const equip = await dbObj.query('SELECT * FROM player_equipment WHERE user_id = $1', [userId]).then(r => (r.rows ? r.rows[0] : r));
    
    const level = player.level || 1;
    let baseAtk = 5 + ((level - 1) * 2);
    let baseDef = 5 + ((level - 1) * 2);
    let baseAgi = 5 + (level - 1);
    let baseCrit = 0.05;

    if (player.class === 'Warrior') { baseAtk += 15; baseDef += 15; }
    if (player.class === 'Ranger') { baseAtk += 12; baseAgi += 8; }
    if (player.class === 'Mage') { baseAtk += 20; }
    if (player.class === 'Assassin') { baseAtk += 18; baseCrit += 0.05; }

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
        
        if (equip.pet_id) {
            const petInfo = require('../../utils/petsData').getPet(equip.pet_id);
            if (petInfo?.buffs) {
                if (petInfo.buffs.atk) baseAtk += petInfo.buffs.atk;
                if (petInfo.buffs.def) baseDef += petInfo.buffs.def;
                if (petInfo.buffs.agi) baseAgi += petInfo.buffs.agi;
                if (petInfo.buffs.crit) baseCrit += petInfo.buffs.crit;
            }
        }
    }

    const learnedSkills = await db.getPlayerSkills(userId);
    const skillsData = require('../../utils/skillsData');
    if (learnedSkills?.length > 0) {
        learnedSkills.forEach(ls => {
            const data = skillsData[player.class]?.find(s => s.id === ls.skill_id);
            if (data?.type === 'passive') {
                if (data.def_bonus) baseDef += data.def_bonus * ls.level;
                if (data.atk_bonus) baseAtk += data.atk_bonus * ls.level;
                if (data.agi_bonus) baseAgi += data.agi_bonus * ls.level;
                if (data.crit_bonus) baseCrit += data.crit_bonus * ls.level;
            }
        });
    }

    const rebirths = player.rebirths || 0;
    if (rebirths > 0) {
        const multiplier = 1 + (rebirths * 0.10);
        baseAtk = Math.floor(baseAtk * multiplier);
        baseDef = Math.floor(baseDef * multiplier);
        baseAgi = Math.floor(baseAgi * multiplier);
        baseCrit = Math.min(1.0, baseCrit + (rebirths * 0.01));
    }

    const queryText = 'UPDATE player_stats SET attack = $1, defense = $2, agility = $3, crit_rate = $4 WHERE user_id = $5';
    const params = [baseAtk, baseDef, baseAgi, baseCrit, userId];
    
    if (client) await client.query(queryText, params);
    else await db.execute(queryText, params);
}

module.exports.recalculateStats = recalculateStats;

