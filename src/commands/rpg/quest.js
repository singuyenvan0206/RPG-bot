const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const questLogic = require('../../utils/questLogic');

module.exports = {
    category: 'RPG',
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Xem và nhận thưởng nhiệm vụ')
        .addSubcommand(sub => sub.setName('list').setDescription('Danh sách nhiệm vụ đang thực hiện'))
        .addSubcommand(sub => sub.setName('claim').setDescription('Nhận thưởng nhiệm vụ đã hoàn thành').addIntegerOption(opt => opt.setName('id').setDescription('Mã nhiệm vụ (ID)').setRequired(true))),
    async execute(interaction) {
        const userId = interaction.user.id;
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const quests = await db.queryAll('SELECT * FROM quests WHERE user_id = $1 AND is_claimed = FALSE ORDER BY quest_type DESC, created_at DESC', [userId]);
            
            if (quests.length === 0) {
                return interaction.reply({ content: '📜 Bạn không có nhiệm vụ nào đang thực hiện. Hãy dùng `/daily` để nhận nhiệm vụ mới!', flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle('📜 Sổ Tay Nhiệm Vụ')
                .setColor('#f1c40f')
                .setDescription('Hoàn thành các mục tiêu bên dưới để nhận thưởng hậu hĩnh.');

            quests.forEach(q => {
                const typeLabel = q.quest_type === 'weekly' ? '🗓️ [HÀNG TUẦN]' : '☀️ [HÀNG NGÀY]';
                let status = `Tiến độ: **${q.progress}/${q.target}**`;
                if (q.completed) status = '✅ **ĐÃ HOÀN THÀNH** (Dùng `/quest claim id:${q.id}` để nhận thưởng)';
                
                embed.addFields({
                    name: `${typeLabel} Quest ID: #${q.id}`,
                    value: `Mục tiêu: ${this.getActionLabel(q.action_type, q.target)}\n${status}\nThưởng: 💰 ${q.reward_gold} | 🌟 ${q.reward_exp}`,
                    inline: false
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'claim') {
            const questId = interaction.options.getInteger('id');
            const res = await questLogic.claimQuest(userId, questId);

            if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, flags: 64 });

            return interaction.reply(`🎊 Chúc mừng! Bạn đã nhận **${res.gold} Gold** và **${res.exp} EXP** từ nhiệm vụ #${questId}!`);
        }
    },

    getActionLabel(type, target) {
        switch (type) {
            case 'kill_monster': return `Tiêu diệt ${target} quái vật`;
            case 'kill_boss': return `Tham gia hạ gục ${target} Boss`;
            case 'earn_gold': return `Kiếm được ${target} Gold`;
            case 'explore': return `Thám hiểm ${target} lần`;
            default: return `Thực hiện ${type} x${target}`;
        }
    }
};
