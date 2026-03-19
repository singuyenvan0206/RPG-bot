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

async function forgeSlot(userId, player, equip, slotKey) {
    const slotCfg = SLOTS[slotKey];
    const itemId = equip[slotCfg.id];
    if (!itemId) return { ok: false, msg: `❌ **${slotCfg.label}**: Không mặc trang bị.` };

    const currentUpgrade = parseInt(equip[slotCfg.upLevel] || 0);
    const itemInfo = itemsData.getItem(itemId);

    const goldCost = 500 * (currentUpgrade + 1);
    let matNeed = 'iron_ore';
    let matAmount = currentUpgrade + 2;

    if (currentUpgrade >= 3 && currentUpgrade <= 6) {
        matNeed = 'magic_core';
        matAmount = currentUpgrade - 1;
    } else if (currentUpgrade >= 7) {
        matNeed = 'void_shard';
        matAmount = 1;
    }

    if (player.gold < goldCost) {
        return { ok: false, msg: `❌ **${slotCfg.label}** (${itemInfo.name}): Thiếu 🪙 ${goldCost} Vàng.` };
    }

    const matInv = await db.queryOne('SELECT amount FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, matNeed]);
    const matInfo = materialsData.getMaterial(matNeed);
    if (!matInv || matInv.amount < matAmount) {
        return { ok: false, msg: `❌ **${slotCfg.label}** (${itemInfo.name}): Thiếu **${matAmount}x ${matInfo.name}**.` };
    }

    // Deduct resources unconditionally first
    await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [goldCost, userId]);
    if (matInv.amount <= matAmount) {
        await db.execute('DELETE FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, matNeed]);
    } else {
        await db.execute('UPDATE inventory SET amount = amount - $1 WHERE user_id = $2 AND item_id = $3', [matAmount, userId, matNeed]);
    }
    player.gold -= goldCost;

    // Success Chance Logic
    let successChance = 1.0;
    if (currentUpgrade >= 4 && currentUpgrade <= 6) successChance = 0.8;
    else if (currentUpgrade >= 7 && currentUpgrade <= 9) successChance = 0.6;
    else if (currentUpgrade >= 10) successChance = 0.4;

    const roll = Math.random();
    
    // SUCCESS
    if (roll < successChance) {
        const newLevel = currentUpgrade + 1;
        await db.execute(`UPDATE player_equipment SET ${slotCfg.upLevel} = $1 WHERE user_id = $2`, [newLevel, userId]);
        return { ok: true, msg: `✅ **${itemInfo.name} [+${newLevel}]** — Thành công! (Mất 🪙 ${goldCost} + ${matAmount}x ${matInfo.name})` };
    } 
    
    // FAIL
    let failMsg = `❌ **${itemInfo.name} [+${currentUpgrade}]** — Đập xịt! Mất trắng nguyên liệu. (${Math.floor(successChance*100)}% thành công)`;
    
    // Downgrade Chance if level >= 7
    if (currentUpgrade >= 7) {
        const dropRoll = Math.random();
        if (dropRoll < 0.5) { // 50% chance to drop 1 level on fail
            const downLevel = Math.max(0, currentUpgrade - 1);
            await db.execute(`UPDATE player_equipment SET ${slotCfg.upLevel} = $1 WHERE user_id = $2`, [downLevel, userId]);
            failMsg = `⚠️ **${itemInfo.name} [+${currentUpgrade} ➡️ +${downLevel}]** — Đập xịt và **RỚT CẤP**! 😭`;
        }
    }

    return { ok: false, msg: failMsg };
}

module.exports = {
    category: 'Crafting',
    aliases: ['fo', 'craft'],
    data: new SlashCommandBuilder()
        .setName('forge')
        .setDescription('Cường hóa trang bị đang mặc (Tốn Vàng & Nguyên liệu)')
        .addStringOption(option =>
            option.setName('slots')
                .setDescription('Slot cần đập (weapon/armor/accessory hoặc "all" cho tất cả, cách nhau bằng dấu phẩy)')
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

        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        if (!equip) return interaction.reply({ content: '❌ Bạn chưa mặc đồ gì!', flags: MessageFlags.Ephemeral });

        let slotsToForge = [];
        if (slotInput === 'all') {
            slotsToForge = ['weapon', 'armor', 'accessory'];
        } else if (SLOTS[slotInput]) {
            slotsToForge = [slotInput];
        } else {
            return interaction.reply({ 
                content: '❌ Lỗi: Slot không hợp lệ. Vui lòng chọn: `weapon`, `armor`, `accessory`, `all` hoặc phím tắt `1`, `2`, `3`.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Forge Animation
        const forgeEmbed = new EmbedBuilder()
            .setTitle('🔥 Thợ Rèn Đang Làm Việc...')
            .setDescription(`Đang cường hóa **${slotsToForge.length}** vị trí...`)
            .setColor('#f39c12')
            .setImage(gifData.forge);

        const msg = await interaction.reply({ embeds: [forgeEmbed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(3000);

        // Process each slot
        const results = [];
        for (const slotKey of slotsToForge) {
            const res = await forgeSlot(userId, player, equip, slotKey);
            results.push(res.msg);
        }

        // Recalculate stats after all forging
        await equipCmd.recalculateStats(userId);

        const desc = results.join('\n');
        const allOk = results.every(r => r.startsWith('✅'));

        const embed = new EmbedBuilder()
            .setColor(allOk ? '#f39c12' : '#e74c3c')
            .setTitle('🔥 Kết Quả Lò Rèn')
            .setDescription(desc);

        return msg.edit({ embeds: [embed] });
    }
};
