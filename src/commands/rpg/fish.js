const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const materialsData = require('../../utils/materialsData');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'Crafting',
    aliases: ['fi', 'fishing'],
    data: new SlashCommandBuilder()
        .setName('fish')
        .setDescription('Buông cần bắt cá tại các vùng nước EchoWorld'),
    help: {
        usage: '/fish',
        examples: ['/fish', '$fi'],
        description: 'Tiêu tốn 5 Mana để câu cá. Có cơ hội nhận được Cá Chép, Cá Hồi hoặc Cá Vàng May Mắn.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);

        if (!player) {
            return interaction.reply({
                content: '❌ Bạn chưa tham gia thế giới này. Hãy dùng lệnh `/start` trước!',
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        const manaCost = 5;
        if (player.mana < manaCost) {
            return interaction.reply({
                content: `❌ Bạn không đủ Mana để câu cá! (Cần **${manaCost} Mana**).`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        const now = Math.floor(Date.now() / 1000);
        const cooldown = 20; // 20 seconds
        const lastFish = Number(player.last_fish || 0);

        if (now - lastFish < cooldown) {
            return interaction.reply({
                content: `⏳ Nước đang động! Hãy đợi thêm **${cooldown - (now - lastFish)} giây** để câu tiếp.`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        // Animation
        const embed = new EmbedBuilder()
            .setTitle('🎣 Đi Câu Cá')
            .setColor('#3498db')
            .setDescription('Bạn đang quăng cần và chờ cá cắn câu...')
            .setImage(gifData.fish);

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        await sleep(3000); // Wait for fishing animation

        // Fishing logic
        const roll = Math.random();
        let droppedItem = 'carp';
        let amount = 1;

        if (roll < 0.05) {
            droppedItem = 'golden_fish';
        } else if (roll < 0.25) {
            droppedItem = 'salmon';
        } else if (roll > 0.90) {
            // Fish escaped
            return msg.edit({
                embeds: [new EmbedBuilder()
                    .setTitle('🎣 Kết Quả Câu Cá')
                    .setDescription('Ôi không! Con cá đã vùng vẫy và thoát mất rồi.\n\n🧪 Mana còn lại: **' + (player.mana - manaCost) + '/' + player.max_mana + '**')
                    .setColor('#e74c3c')]
            });
        }

        const fishInfo = materialsData.getMaterial(droppedItem);

        // Update DB
        await db.execute('UPDATE players SET mana = mana - $1, last_fish = $2 WHERE user_id = $3', [manaCost, now, userId]);
        await db.execute(
            'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + $3',
            [userId, droppedItem, amount]
        );

        const finalEmbed = new EmbedBuilder()
            .setTitle('🎣 Kết Quả Câu Cá')
            .setDescription(`Bạn đã kéo lên được: **${amount}x ${fishInfo.name}**!\n\n🧪 Mana còn lại: **${player.mana - manaCost}/${player.max_mana}**`)
            .setColor('#2ecc71')
            .setTimestamp();

        return msg.edit({ embeds: [finalEmbed] });
    },
};
