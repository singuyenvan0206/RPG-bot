const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database');
const shopData = require('../../utils/shopData');

module.exports = {
    category: 'RPG',
    aliases: ['u', 'su'],
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Sử dụng vật phẩm tiêu hao trong túi đồ')
        .addStringOption(option =>
            option.setName('item_id')
                .setDescription('Mã hoặc tên vật phẩm (VD: 902 hoặc healing_potion)')
                .setRequired(true)
        ),
    help: {
        usage: '/use [item_id]',
        examples: ['/use 902', '$use healing_potion'],
        description: 'Dùng vật phẩm tiêu hao (Consumable) như thuốc hồi HP, hồi Mana.'
    },
    async execute(interaction) {
        const { MessageFlags } = require('discord.js');
        const userId = interaction.user.id;
        let userInput = interaction.options.getString('item_id');
        
        // Lookup numeric id if possible
        if (!isNaN(userInput)) {
            const shopItem = shopData.consumables?.find(i => i.code == userInput);
            if (shopItem) userInput = shopItem.id;
        }

        const validPotions = ['minor_healing_potion', 'healing_potion', 'major_healing_potion', 'mana_potion', 'revive_potion'];
        if (!validPotions.includes(userInput)) {
            return interaction.reply({
                content: `❌ Vật phẩm \`${userInput}\` không phải là vật phẩm tiêu hao có thể sử dụng (hiện tại hỗ trợ: thuốc máu nhỏ/vừa/lớn, hồi mana, hồi sinh)!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Lỗi Player. Vui lòng thử lại.', flags: MessageFlags.Ephemeral });

        // Check inventory
        const inv = await db.queryOne('SELECT amount FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, userInput]);
        const itemObj = shopData.consumables?.find(i => i.id === userInput);
        if (!inv || inv.amount <= 0) {
            return interaction.reply({
                content: `❌ Bạn không có **${itemObj ? itemObj.name : userInput}** trong túi đồ!`,
                flags: MessageFlags.Ephemeral
            });
        }

        let log = '';
        if (userInput === 'minor_healing_potion' || userInput === 'healing_potion' || userInput === 'major_healing_potion') {
            if (player.hp >= player.max_hp) {
                return interaction.reply({ content: `❌ Máu của bạn đã đầy rồi! (${player.hp}/${player.max_hp})`, flags: MessageFlags.Ephemeral });
            }
            let healAmount = 0;
            if (userInput === 'minor_healing_potion') healAmount = 50;
            else if (userInput === 'healing_potion') healAmount = 150;
            else healAmount = 300;

            const newHp = Math.min(player.max_hp, player.hp + healAmount);
            await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [newHp, userId]);
            log = `💚 Bạn đã sử dụng **${itemObj.name}**, phục hồi ${healAmount} HP! (HP hiện tại: ${newHp}/${player.max_hp})`;
        } else if (userInput === 'mana_potion') {
            if (player.mana >= player.max_mana) {
                return interaction.reply({ content: `❌ Mana của bạn đã đầy rồi! (${player.mana}/${player.max_mana})`, flags: MessageFlags.Ephemeral });
            }
            const newMana = Math.min(player.max_mana, player.mana + 50);
            await db.execute('UPDATE players SET mana = $1 WHERE user_id = $2', [newMana, userId]);
            log = `✨ Bạn đã sử dụng **Thuốc Hồi Mana**, phục hồi 50 Mana! (Mana hiện tại: ${newMana}/${player.max_mana})`;
        } else if (userInput === 'revive_potion') {
            const now = Date.now();
            if (player.hp >= player.max_hp && (!player.dead_until || player.dead_until < now)) {
                return interaction.reply({ content: `❌ Bạn đang hoàn toàn khỏe mạnh, không cần lãng phí Nước Hồi Sinh!`, flags: MessageFlags.Ephemeral });
            }
            await db.execute('UPDATE players SET hp = $1, dead_until = 0 WHERE user_id = $2', [player.max_hp, userId]);
            log = `🕊️ Một nguồn sáng chói lóa bao phủ lấy bạn... Bạn đã dùng **Nước Hồi Sinh**, hồi phục lại 100% sinh lực và xóa tan án phạt tử vong! (HP hiện tại: ${player.max_hp}/${player.max_hp})`;
        }

        // Deduct 1 item
        if (inv.amount === 1) {
            await db.execute('DELETE FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, userInput]);
        } else {
            await db.execute('UPDATE inventory SET amount = amount - 1 WHERE user_id = $1 AND item_id = $2', [userId, userInput]);
        }

        return interaction.reply({ content: log });
    }
};
