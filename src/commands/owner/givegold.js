const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('givegold')
        .setDescription('[Owner Only] Cộng hoặc trừ vàng của người chơi')
        .addUserOption(opt => opt.setName('user').setDescription('Người chơi').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Số vàng (có thể âm để trừ)').setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', flags: 64 });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const userId = targetUser.id;

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({ content: `❌ Người dùng **${targetUser.username}** chưa tham gia RPG.`, flags: 64 });
        }

        await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [amount, userId]);
        
        const embed = new EmbedBuilder()
            .setTitle('💰 Cập nhật Vàng')
            .setDescription(`Đã ${amount >= 0 ? 'cộng' : 'trừ'} **${Math.abs(amount).toLocaleString()}** vàng cho **${targetUser.username}**.`)
            .setColor(amount >= 0 ? '#f1c40f' : '#e74c3c')
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
