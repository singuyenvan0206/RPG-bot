const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'RPG',
    aliases: ['s', 'st'],
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Bắt đầu cuộc hành trình EchoWorld RPG của bạn'),
    help: {
        usage: '/start',
        examples: ['/start', '$s'],
        description: 'Lệnh khởi đầu dành cho người chơi mới. Cho phép bạn chọn 1 trong 4 Chức Nghiệp: Warrior, Ranger, Mage, Assassin để bắt đầu thám hiểm.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        
        // Check if player already exists
        const player = await db.getPlayer(userId);
        if (player) {
            const classEmojis = { 'Warrior': '⚔️', 'Ranger': '🏹', 'Mage': '🔮', 'Assassin': '🗡️' };
            const classEmoji = classEmojis[player.class] || '🛡️';
            return interaction.reply({
                content: `❌ Bạn đã là một Echo trong thế giới này với chức nghiệp **${classEmoji} ${player.class}** (Lv.${player.level}). Hãy dùng lệnh \`/explore\` để thám hiểm!`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🌌 Chào Mừng Đến EchoWorld')
            .setDescription('Ngươi là một Echo – thực thể được triệu hồi từ chiều không gian khác. Hãy chọn con đường của mình để bắt đầu hành trình thay đổi thế giới này.')
            .setColor('#2b2d31')
            .addFields(
                { name: '⚔️ Warrior (Chiến Binh)', value: 'Cận chiến, Sinh lực và Phòng thủ vượt trội.', inline: true },
                { name: '🏹 Ranger (Cung Thủ)', value: 'Tấn công xa, Nhanh nhẹn và Né tránh cao.', inline: true },
                { name: '🔮 Mage (Pháp Sư)', value: 'Sát thương phép thuật khủng khiếp, Năng lượng dồi dào.', inline: true },
                { name: '🗡️ Assassin (Sát Thủ)', value: 'Sát thương chí mạng cao, dồn sát thương mục tiêu đơn.', inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_class')
                    .setPlaceholder('Chọn Chức Nghiệp Khởi Đầu')
                    .addOptions([
                        { label: 'Warrior', description: 'Trở thành Chiến Binh', value: 'Warrior', emoji: '⚔️' },
                        { label: 'Ranger', description: 'Trở thành Cung Thủ', value: 'Ranger', emoji: '🏹' },
                        { label: 'Mage', description: 'Trở thành Pháp Sư', value: 'Mage', emoji: '🔮' },
                        { label: 'Assassin', description: 'Trở thành Sát Thủ', value: 'Assassin', emoji: '🗡️' },
                    ]),
            );

        const response = await interaction.reply({ embeds: [embed], components: [row] });

        // Collector for interaction
        const collector = response.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 60000 });

        collector.on('collect', async i => {
            const selectedClass = i.values[0];
            const classEmojis = { 'Warrior': '⚔️', 'Ranger': '🏹', 'Mage': '🔮', 'Assassin': '🗡️' };
            const classEmoji = classEmojis[selectedClass] || '🛡️';

            try {
                await db.createPlayer(userId, selectedClass);

                const successEmbed = new EmbedBuilder()
                    .setTitle('🎉 Chức Nghiệp Xác Nhận')
                    .setDescription(`Bạn đã trở thành một **${classEmoji} ${selectedClass}**. Cuộc hành trình của bạn tại EchoWorld chính thức bắt đầu!\n\nHãy dùng lệnh \`/explore\` để tiến vào Vùng Đất Khởi Đầu.`)
                    .setColor('#57F287');

                await i.update({ embeds: [successEmbed], components: [] });
            } catch (error) {
                console.error('Error creating player:', error);
                await i.reply({ content: '❌ Có lỗi xảy ra khi khởi tạo nhân vật. Vui lòng thử lại!', ephemeral: true });
            }
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '⏱️ Đã hết thời gian chọn chức nghiệp. Vui lòng gõ lại `/start`.', components: [] });
            }
        });
    },
};

