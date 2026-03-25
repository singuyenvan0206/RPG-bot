const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('[Owner Only] Xóa toàn bộ dữ liệu của một người chơi')
        .addUserOption(opt => opt.setName('user').setDescription('Người chơi cần reset').setRequired(true)),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', flags: 64 });
        }

        // Handle both slash command option and prefix command simulation
        let targetUser = interaction.options.getUser('user');
        
        // Due to the custom mock object in messageCreate.js for prefix commands
        if (!targetUser && interaction.options.getUser) {
             targetUser = interaction.options.getUser('user');
        }

        if (!targetUser) {
            return interaction.reply({ content: '❌ Không tìm thấy người dùng!', flags: 64 });
        }

        const userId = targetUser.id;

        await interaction.deferReply();

        try {
            const player = await db.getPlayer(userId);
            if (!player) {
                return interaction.editReply({ content: `❌ Người dùng **${targetUser.username}** chưa tham gia RPG.` });
            }

            // Xóa bang hội do user làm chủ (do không có CASCADE từ players sang owner_id)
            await db.execute('DELETE FROM rpg_guilds WHERE owner_id = $1', [userId]);
            
            // Xóa các giao dịch truy xuất bằng ID
            await db.execute('DELETE FROM trades WHERE sender_id = $1 OR receiver_id = $1', [userId]);

            // Database có ON DELETE CASCADE cho hầu hết các bảng, xoá user sẽ xoá tất tần tật
            await db.execute('DELETE FROM players WHERE user_id = $1', [userId]);

            const embed = new EmbedBuilder()
                .setTitle('♻️ Reset Người Chơi')
                .setDescription(`Đã xóa toàn bộ dữ liệu của **${targetUser.username}** thành công.`)
                .setColor('#e74c3c')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('[Reset User Error]', error);
            await interaction.editReply({ content: '❌ Đã xảy ra lỗi khi reset người dùng: ' + error.message });
        }
    },
};
