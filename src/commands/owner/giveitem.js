const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const itemsData = require('../../utils/itemsData');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('giveitem')
        .setDescription('[Owner Only] Tặng vật phẩm cho người chơi')
        .addUserOption(opt => opt.setName('user').setDescription('Người chơi').setRequired(true))
        .addStringOption(opt => opt.setName('item_id').setDescription('ID vật phẩm (ví dụ: sharp_stick)').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng').setRequired(false)),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', flags: 64 });
        }

        const targetUser = interaction.options.getUser('user');
        const itemId = interaction.options.getString('item_id');
        const amount = interaction.options.getInteger('amount') || 1;
        const userId = targetUser.id;

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({ content: `❌ Người dùng **${targetUser.username}** chưa tham gia RPG.`, flags: 64 });
        }

        const item = itemsData.getItem(itemId);
        if (!item) return interaction.reply({ content: `❌ Không tìm thấy vật phẩm có ID \`${itemId}\`.`, flags: 64 });

        await db.execute(
            'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + $3',
            [userId, itemId, amount]
        );

        const embed = new EmbedBuilder()
            .setTitle('🎁 Tặng Vật Phẩm')
            .setDescription(`Đã tặng **${amount}x ${item.name}** cho **${targetUser.username}**.`)
            .setColor('#3498db')
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
