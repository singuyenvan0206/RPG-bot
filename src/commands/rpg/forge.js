const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const gifData = require('../../utils/gifData');
const itemsData = require('../../utils/itemsData');
const materialsData = require('../../utils/materialsData');
const equipCmd = require('./equip');

const SLOTS = {
    weapon: { id: 'weapon_id', upLevel: 'weapon_upgrade', label: 'Vũ Khí' },
    armor: { id: 'armor_id', upLevel: 'armor_upgrade', label: 'Áo Giáp' },
    accessory: { id: 'accessory_id', upLevel: 'accessory_upgrade', label: 'Phụ Kiện' }
};

module.exports = {
    category: 'Crafting',
    aliases: ['fo', 'craft'],
    data: new SlashCommandBuilder()
        .setName('forge')
        .setDescription('Cường hóa trang bị đang mặc (Tốn Vàng & Nguyên liệu)')
        .addStringOption(option =>
            option.setName('slots')
                .setDescription('Slot cần đập (weapon/armor/accessory hoặc "all")')
                .setRequired(true)
                .addChoices(
                    { name: 'Vũ Khí (Weapon)', value: 'weapon' },
                    { name: 'Áo Giáp (Armor)', value: 'armor' },
                    { name: 'Phụ Kiện (Accessory)', value: 'accessory' },
                    { name: 'Tất Cả (All)', value: 'all' }
                )
        ),
    help: {
        usage: '/forge <weapon|armor|accessory|all>',
        examples: ['/forge weapon', '/forge all'],
        description: 'Cường hóa trang bị đang mặc. Dùng "all" để cường hóa cùng lúc tất cả slot.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const { MessageFlags } = require('discord.js');
        const slotInput = interaction.options.getString('slots');

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        let slotsToForge = [];
        if (slotInput === 'all') slotsToForge = ['weapon', 'armor', 'accessory'];
        else if (SLOTS[slotInput]) slotsToForge = [slotInput];

        const forgeEmbed = new EmbedBuilder()
            .setTitle('🔥 Thợ Rèn Đang Làm Việc...')
            .setDescription(`Đang cường hóa **${slotsToForge.length}** vị trí...`)
            .setColor('#f39c12')
            .setImage(gifData.forge || null);

        const msg = await interaction.reply({ embeds: [forgeEmbed], fetchReply: true });
        await new Promise(r => setTimeout(r, 2000));

        const results = [];
        try {
            await db.withTransaction(async (client) => {
                const equip = await client.query('SELECT * FROM player_equipment WHERE user_id = $1', [userId]).then(r => r.rows[0]);
                if (!equip) throw new Error('NO_EQUIP');

                for (const slotKey of slotsToForge) {
                    const res = await forgeSlot(userId, player, equip, slotKey, client);
                    results.push(res.msg);
                }
                await equipCmd.recalculateStats(userId, client);
            });

            const embed = new EmbedBuilder()
                .setTitle('🔥 Kết Quả Lò Rèn')
                .setDescription(results.join('\n'))
                .setColor('#f39c12');
            return msg.edit({ embeds: [embed] });

        } catch (err) {
            if (err.message === 'NO_EQUIP') return msg.edit({ content: '❌ Bạn không có trang bị!' });
            console.error(err);
            return msg.edit({ content: '❌ Lỗi hệ thống khi cường hóa or thiếu tài nguyên.' });
        }
    }
};

async function forgeSlot(userId, player, equip, slotKey, client) {
    const slotCfg = SLOTS[slotKey];
    const itemId = equip[slotCfg.id];
    if (!itemId) return { ok: false, msg: `❌ **${slotCfg.label}**: Trống.` };

    const currentUpgrade = parseInt(equip[slotCfg.upLevel] || 0);
    const itemInfo = itemsData.getItem(itemId);
    const goldCost = 500 * (currentUpgrade + 1);
    
    // --- CLASS-SPECIFIC MATERIALS ---
    const classMaterials = {
        'Warrior': { low: 'iron_ore', mid: 'steel_ingot', high: 'demon_horn' },
        'Ranger': { low: 'oak_wood', mid: 'elven_wood', high: 'spirit_bark' },
        'Mage': { low: 'magic_core', mid: 'mana_blossom', high: 'light_essence' },
        'Assassin': { low: 'bronze_scrap', mid: 'emerald', high: 'void_shard' },
        'Novice': { low: 'iron_ore', mid: 'iron_ore', high: 'iron_ore' }
    };

    const mats = classMaterials[player.class] || classMaterials['Novice'];
    let matNeed = mats.low;
    let matAmount = currentUpgrade + 2;

    if (currentUpgrade >= 5 && currentUpgrade < 10) {
        matNeed = mats.mid;
        matAmount = Math.max(1, Math.floor(currentUpgrade / 2));
    } else if (currentUpgrade >= 10) {
        matNeed = mats.high;
        matAmount = 1;
    }

    const matInv = await client.query('SELECT amount FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, matNeed]).then(r => r.rows[0]);
    if (!matInv || matInv.amount < matAmount || player.gold < goldCost) {
        return { ok: false, msg: `❌ **${itemInfo.name}**: Thiếu nguyên liệu/vàng.` };
    }

    // Deduct
    await client.query('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [goldCost, userId]);
    await client.query('UPDATE inventory SET amount = amount - $1 WHERE user_id = $2 AND item_id = $3', [matAmount, userId, matNeed]);
    player.gold -= goldCost;

    let successChance = 1.0;
    if (currentUpgrade >= 1 && currentUpgrade <= 3) successChance = 0.95;
    else if (currentUpgrade >= 4 && currentUpgrade <= 6) successChance = 0.8;
    else if (currentUpgrade >= 7 && currentUpgrade <= 9) successChance = 0.6;
    else if (currentUpgrade >= 10) successChance = 0.35;

    if (Math.random() < successChance) {
        const newLevel = currentUpgrade + 1;
        await client.query(`UPDATE player_equipment SET ${slotCfg.upLevel} = $1 WHERE user_id = $2`, [newLevel, userId]);
        return { ok: true, msg: `✅ **${itemInfo.name} [+${newLevel}]** — Thành công!` };
    }

    let failMsg = `❌ **${itemInfo.name} [+${currentUpgrade}]** — Thất bại.`;
    if (currentUpgrade >= 10) { 
        if (Math.random() < 0.25) { // 25% chance to drop
            const downLevel = Math.max(0, currentUpgrade - 1);
            await client.query(`UPDATE player_equipment SET ${slotCfg.upLevel} = $1 WHERE user_id = $2`, [downLevel, userId]);
            failMsg = `⚠️ **${itemInfo.name} [+${currentUpgrade} ➡️ +${downLevel}]** — Thất bại & Rớt cấp!`;
        }
    }
    return { ok: false, msg: failMsg };
}
