const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const materialsData = require('../../utils/materialsData');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'Crafting',
    aliases: ['m', 'dig'],
    data: new SlashCommandBuilder()
        .setName('mine')
        .setDescription('Khai thác quặng sắt và nguyên liệu quý hiếm'),
    help: {
        usage: '/mine',
        examples: ['/mine', '$m'],
        description: 'Tiêu tốn 10 Mana để khai thác quặng. Bạn có thể nhận được Quặng Sắt, Lõi Phép hoặc thậm chí là Mảnh Vỡ Hư Không.'
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

        const manaCost = 10;
        if (player.mana < manaCost) {
            return interaction.reply({
                content: `❌ Bạn không đủ Mana để khai thác! (Cần **${manaCost} Mana**). Hãy dùng bình Mana hoặc đợi hồi phục.`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        const now = Math.floor(Date.now() / 1000);
        const cooldown = 30; // 30 seconds
        const lastMine = Number(player.last_mine || 0);

        if (now - lastMine < cooldown) {
            return interaction.reply({
                content: `⏳ Bạn đang mệt mỏi! Hãy đợi thêm **${cooldown - (now - lastMine)} giây** để tiếp tục đào mỏ.`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        // Animation
        const embed = new EmbedBuilder()
            .setTitle('⛏️ Khai Thác Mỏ')
            .setColor('#7f8c8d')
            .setDescription('Bạn đang tiến vào mỏ đá và vung cuốc...')
            .setImage(gifData.mine);

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        await sleep(2500); // GIF duration or wait time

        // Mining logic
        const roll = Math.random();
        let droppedItem = 'iron_ore';
        let amount = Math.floor(Math.random() * 3) + 1; // 1-3 iron ore

        if (roll < 0.02) {
            droppedItem = 'diamond';
            amount = 1;
        } else if (roll < 0.08) {
            const gems = ['ruby', 'emerald', 'sapphire'];
            droppedItem = gems[Math.floor(Math.random() * gems.length)];
            amount = 1;
        } else if (roll < 0.15) {
            droppedItem = 'void_shard';
            amount = 1;
        } else if (roll < 0.35) {
            droppedItem = 'magic_core';
            amount = 1;
        }

        const material = materialsData.getMaterial(droppedItem);

        // Update DB
        await db.execute('UPDATE players SET mana = mana - $1, last_mine = $2 WHERE user_id = $3', [manaCost, now, userId]);
        await db.execute(
            'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + $3',
            [userId, droppedItem, amount]
        );

        const finalEmbed = new EmbedBuilder()
            .setTitle('⛏️ Kết Quả Khai Thác')
            .setDescription(`Bạn đã vung cuốc vào vách đá...\n\n💎 Bạn nhận được: **${amount}x ${material.name}**\n🧪 Mana còn lại: **${player.mana - manaCost}/${player.max_mana}**`)
            .setColor('#2ecc71')
            .setTimestamp();

        return msg.edit({ embeds: [finalEmbed] });
    },
};
