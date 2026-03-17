const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const questLogic = require('../../utils/questLogic');
const rpgLogic = require('../../utils/rpgLogic');

const ACTION_NAMES = {
    'kill_monster': 'Tiêu diệt Quái vật bằng /explore',
    'kill_boss': 'Tiêu diệt World Boss',
    'earn_gold': 'Thu thập Vàng',
    'explore': 'Sử dụng lệnh /explore'
};

module.exports = {
    category: 'RPG',
    aliases: ['q', 'task'],
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Xem danh sách Nhiệm Vụ Hằng Ngày (Daily Bounties)')
        .addSubcommand(sub =>
            sub.setName('claim')
               .setDescription('Nhận thưởng các nhiệm vụ đã hoàn thành')
        ),
    help: {
        usage: '/quest | /quest claim',
        examples: ['/quest', '/quest claim', '$q'],
        description: 'Xem danh sách nhiệm vụ hằng ngày từ Hiệp Hội. Dùng /quest claim để nhận thưởng sau khi hoàn thành mục tiêu.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const { MessageFlags } = require('discord.js');

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: MessageFlags.Ephemeral });

        let activeQuests = await db.queryAll('SELECT * FROM quests WHERE user_id = $1 AND completed = FALSE', [userId]);

        // Check if using subcommand or not
        const sub = interaction.options.getSubcommand(false);

        // If no subcommand (or 'list'), show quest list
        if (!sub || sub !== 'claim') {
            if (activeQuests.length === 0) {
                await questLogic.generateDailyQuests(userId);
                activeQuests = await db.queryAll('SELECT * FROM quests WHERE user_id = $1 AND completed = FALSE', [userId]);
                interaction.channel.send(`<@${userId}> Kẻ lang thang, Hiệp Hội Thợ Săn đã gửi cho bạn 3 nhiệm vụ mới!`);
            }

            const embed = new EmbedBuilder()
                .setTitle('📜 Bảng Chỉ Thị Nhiệm Vụ')
                .setColor('#3498db')
                .setDescription('Hoàn thành các mục tiêu dưới đây để nhận thưởng khủng. Nếu thanh tiến độ đầy, hãy dùng lệnh `/quest claim`.');

            activeQuests.forEach(q => {
                const actName = ACTION_NAMES[q.action_type] || q.action_type;
                const status = q.progress >= q.target ? '✅ Hoàn Thành' : '⏳ Đang tiến hành';
                embed.addFields({
                    name: `Mã lệnh #${q.id}: ${actName}`,
                    value: `Tiến độ: **${q.progress}/${q.target}**\nThưởng: 🪙 ${q.reward_gold} Vàng | 🌟 ${q.reward_exp} EXP\nTrạng thái: ${status}`
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

        // /quest claim
        if (sub === 'claim') {
            const completedQuests = activeQuests.filter(q => q.progress >= q.target);
            if (completedQuests.length === 0) {
                return interaction.reply({ content: '❌ Bạn chưa hoàn thành nhiệm vụ nào để nhận thưởng!', flags: MessageFlags.Ephemeral });
            }

            let totalGold = 0;
            let totalExp = 0;

            for (const q of completedQuests) {
                totalGold += Number(q.reward_gold);
                totalExp += Number(q.reward_exp);
                await db.execute('UPDATE quests SET completed = TRUE WHERE id = $1', [q.id]);
            }

            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [totalGold, userId]);
            const expResult = await rpgLogic.addExp(userId, totalExp);

            let msg = `🎉 **HOÀN THÀNH NHIỆM VỤ!**\nBạn đã báo cáo ${completedQuests.length} nhiệm vụ và nhận được:\n🪙 **${totalGold} Vàng**\n🌟 **${totalExp} EXP**`;
            
            if (expResult && expResult.leveledUp) {
                msg += `\n\n🆙 **LÊN CẤP!** Bạn đã đạt cấp độ ${expResult.newLevel}!`;
            }

            const embed = new EmbedBuilder().setColor('#f1c40f').setDescription(msg);
            return interaction.reply({ embeds: [embed] });
        }
    }
};
