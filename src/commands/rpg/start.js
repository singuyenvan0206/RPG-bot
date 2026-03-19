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

        // --- PHASE 1: INITIAL REGISTRATION (NOVICE) ---
        if (!player) {
            try {
                await db.createPlayer(userId, 'Novice');
                const startEmbed = new EmbedBuilder()
                    .setTitle('🌌 Chào Mừng Đến EchoWorld')
                    .setDescription('Ngươi là một Echo – thực thể được triệu hồi từ chiều không gian khác. Hiện tại ngươi là một **Tân Thủ (Novice)**.\n\n🍃 Hãy dùng lệnh `/explore` để thám hiểm **Khu Rừng Thì Thầm** và rèn luyện bản thân.\n\n⚠️ **Lưu ý:** Ngươi cần đạt **Cấp độ 10** để có thể chọn một trong các Chức nghiệp chính thức (Warrior, Mage, Ranger, Assassin).')
                    .setColor('#3498db')
                    .setThumbnail(interaction.user.displayAvatarURL());

                return interaction.reply({ embeds: [startEmbed] });
            } catch (error) {
                console.error('Error creating player:', error);
                return interaction.reply({ content: '❌ Có lỗi xảy ra khi khởi tạo nhân vật. Vui lòng thử lại!', ephemeral: true });
            }
        }

        // --- PHASE 2: JOB CHANGE (LV 10+) ---
        if (player.class === 'Novice') {
            if (player.level < 10) {
                return interaction.reply({
                    content: `✨ Bạn hiện là **Tân Thủ (Novice)** Cấp ${player.level}. Hãy tiếp tục hành trình thám hiểm cho đến khi đạt **Cấp 10** để chọn Chức nghiệp chính thức nhé!`,
                    flags: require('discord.js').MessageFlags.Ephemeral
                });
            }

            // Show Class Selection Menu
            const embed = new EmbedBuilder()
                .setTitle('⚔️ Lễ Thăng Tiến Chức Nghiệp')
                .setDescription('Ngươi đã rèn luyện đủ bản lĩnh. Giờ là lúc chọn con đường thực sự của một Echo. Hãy cân nhắc kỹ, vì đây là quyết định không thể thay đổi!')
                .setColor('#f1c40f')
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
                        .setPlaceholder('Chọn Chức Nghiệp Chính Thức')
                        .addOptions([
                            { label: 'Warrior', description: 'Trở thành Chiến Binh', value: 'Warrior', emoji: '⚔️' },
                            { label: 'Ranger', description: 'Trở thành Cung Thủ', value: 'Ranger', emoji: '🏹' },
                            { label: 'Mage', description: 'Trở thành Pháp Sư', value: 'Mage', emoji: '🔮' },
                            { label: 'Assassin', description: 'Trở thành Sát Thủ', value: 'Assassin', emoji: '🗡️' },
                        ]),
                );

            const response = await interaction.reply({ embeds: [embed], components: [row] });
            const collector = response.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 60000 });

            collector.on('collect', async i => {
                const selectedClass = i.values[0];
                const classEmojis = { 'Warrior': '⚔️', 'Ranger': '🏹', 'Mage': '🔮', 'Assassin': '🗡️' };
                const classEmoji = classEmojis[selectedClass] || '🛡️';

                try {
                    await db.updatePlayerClass(userId, selectedClass);

                    const successEmbed = new EmbedBuilder()
                        .setTitle('🎉 Chúc Mừng Thăng Tiến!')
                        .setDescription(`Ngươi đã chính thức trở thành một **${classEmoji} ${selectedClass}**. Sức mạnh mới đã chảy trong cơ thể ngươi!\n\nHãy tiếp tục thám hiểm những vùng đất xa xôi hơn.`)
                        .setColor('#57F287');

                    await i.update({ embeds: [successEmbed], components: [] });
                } catch (error) {
                    console.error('Error updating player class:', error);
                    await i.reply({ content: '❌ Có lỗi xảy ra khi thăng tiến. Vui lòng thử lại!', ephemeral: true });
                }
                collector.stop();
            });
            return;
        }

        // --- PHASE 3: ALREADY HAS A CLASS ---
        const classEmojis = { 'Warrior': '⚔️', 'Ranger': '🏹', 'Mage': '🔮', 'Assassin': '🗡️' };
        const classEmoji = classEmojis[player.class] || '🛡️';
        return interaction.reply({
            content: `❌ Bạn đã là một Echo chức nghiệp **${classEmoji} ${player.class}** (Lv.${player.level}). Hãy tiếp tục rèn luyện sức mạnh!`,
            flags: require('discord.js').MessageFlags.Ephemeral
        });
    },
};

