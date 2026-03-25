const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('resetdatabase')
        .setDescription('[Owner Only] Xóa TOÀN BỘ dữ liệu game (Cảnh báo: Không thể khôi phục!)'),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', flags: 64 });
        }

        await interaction.deferReply();

        try {
            // Truncate tables with CASCADE to wipe absolutely everything in the RPG ecosystem
            await db.execute(`
                TRUNCATE TABLE 
                    players, 
                    rpg_guilds, 
                    world_states, 
                    world_boss_damage, 
                    guild_territories, 
                    trades 
                CASCADE
            `);
            
            const embed = new EmbedBuilder()
                .setTitle('⚠️ RESET TOÀN BỘ DỮ LIỆU')
                .setDescription('Tất cả lưu trữ về người chơi, vật phẩm, bang hội, chợ, thông tin bản đồ... đã bị xóa sạch hoàn toàn khỏi hệ thống.')
                .setColor('#e74c3c')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('[Reset DB Error]', error);
            await interaction.editReply({ content: '❌ Đã xảy ra lỗi khi reset database: ' + error.message });
        }
    },
};
