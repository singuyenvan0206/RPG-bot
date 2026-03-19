const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const rpgLogic = require('../../utils/rpgLogic');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'Economy',
    aliases: ['da', 'claim'],
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Nhận phần thưởng điểm danh hằng ngày'),
    help: {
        usage: '/daily',
        examples: ['/daily', '$d'],
        description: 'Nhận phần thưởng điểm danh mỗi 24 giờ. Phần thưởng bao gồm 500 Vàng và 200 EXP.'
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

        const now = Math.floor(Date.now() / 1000);
        const cooldown = 24 * 60 * 60; // 24 hours
        const streakWindow = 48 * 60 * 60; // 48 hours
        const lastDaily = Number(player.last_daily || 0);
        let streak = Number(player.daily_streak || 0);

        if (now - lastDaily < cooldown) {
            const timeLeft = cooldown - (now - lastDaily);
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            return interaction.reply({
                content: `⏳ Bạn đã nhận thưởng hôm nay rồi! Hãy quay lại sau **${hours} giờ ${minutes} phút**.`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        // Claim Animation
        const claimEmbed = new EmbedBuilder()
            .setTitle('🎁 Đang Nhận Quà...')
            .setDescription('Bạn đang mở rương quà hằng ngày...')
            .setColor('#f1c40f')
            .setImage(gifData.daily);

        const msg = await interaction.reply({ embeds: [claimEmbed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(3000); // Chest opening duration

        // Streak check
        if (lastDaily === 0 || (now - lastDaily > streakWindow)) {
            streak = 1;
        } else {
            streak++;
        }

        // Rewards with streak bonus
        const baseGold = 500;
        const baseExp = 200;
        const bonusGold = Math.min((streak - 1) * 100, 2000); // Max 2000 bonus
        const bonusExp = Math.min((streak - 1) * 50, 1000);   // Max 1000 bonus

        const totalGold = baseGold + bonusGold;
        const totalExp = baseExp + bonusExp;

        let milestoneReward = null;
        if (streak > 0 && streak % 7 === 0) {
            milestoneReward = 'diamond';
            await db.execute(
                'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, 1) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1',
                [userId, milestoneReward]
            );
        }

        await db.execute(
            'UPDATE players SET gold = gold + $1, last_daily = $2, daily_streak = $3 WHERE user_id = $4', 
            [totalGold, now, streak, userId]
        );
        const expResult = await rpgLogic.addExp(userId, totalExp);

        let resultMsg = `🔥 Chuỗi điểm danh: **${streak} ngày**\n\n`;
        resultMsg += `💰 Bạn nhận được **${totalGold} Vàng** (Thưởng chuỗi: +${bonusGold})\n`;
        resultMsg += `🌟 Bạn nhận được **${totalExp} EXP** (Thưởng chuỗi: +${bonusExp})`;
        
        if (milestoneReward) {
            resultMsg += `\n\n🎁 **Quà Kỉ Niệm ${streak} Ngày:** 1x **Diamond** 💎!`;
        }

        if (expResult && expResult.leveledUp) {
            resultMsg += `\n\n🆙 **LÊN CẤP!** Bạn đã đạt đến cấp độ **${expResult.newLevel}**!`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎁 Phần Thưởng Điểm Danh')
            .setDescription(resultMsg)
            .setColor(streak > 1 ? '#e67e22' : '#f1c40f')
            .setTimestamp();

        return msg.edit({ embeds: [embed] });
    },
};
