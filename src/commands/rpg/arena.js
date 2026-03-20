const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../database');
const gifData = require('../../utils/gifData');
const PvpService = require('../../services/PvpService');

module.exports = {
    category: 'RPG',
    aliases: ['a', 'pvp'],
    data: new SlashCommandBuilder()
        .setName('arena')
        .setDescription('Hệ thống Đấu Trường Xếp Hạng (PvP)')
        .addSubcommand(sub => 
            sub.setName('rank')
               .setDescription('Xem điểm xếp hạng (Elo) của bạn và Top Server')
        )
        .addSubcommand(sub => 
            sub.setName('match')
               .setDescription('Tìm kiếm đối thủ để quyết đấu')
        ),
    help: {
        usage: '/arena <rank|match>',
        examples: ['/arena rank', '/arena match', '$a match'],
        description: 'Tham gia quyết đấu với những người chơi khác để leo bảng xếp hạng Elo. Thắng được cộng Elo, thua bị trừ. Top server sẽ được vinh danh trong bảng xếp hạng.'
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: MessageFlags.Ephemeral });

        // Ensure arena stats exist
        await db.execute(
            'INSERT INTO arena_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
            [userId]
        );

        if (sub === 'rank') {
            const myStats = await db.queryOne('SELECT * FROM arena_stats WHERE user_id = $1', [userId]);
            const topStats = await db.queryAll('SELECT * FROM arena_stats ORDER BY elo DESC, wins DESC LIMIT 5');

            const rankInfo = PvpService.getRankInfo(myStats.elo);
            const embed = new EmbedBuilder()
                .setTitle('🏆 Đấu Trường Hắc Ám: Bảng Xếp Hạng')
                .setColor(rankInfo.color)
                .setDescription(`Hạng hiện tại: **${rankInfo.name}**\nBạn đang có **${myStats.elo} Elo** (Thắng: ${myStats.wins} | Thua: ${myStats.losses})\n\n**TOP 5 SERVER:**`);

            topStats.forEach((t, i) => {
                const tr = PvpService.getRankInfo(t.elo);
                embed.addFields({
                    name: `Hạng ${i + 1}`,
                    value: `<@${t.user_id}> - Elo: **${t.elo}** (${tr.name})`
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'match') {
            const nowMs = Date.now();
            if (player.dead_until && player.dead_until > nowMs) {
                const secsLeft = Math.ceil((player.dead_until - nowMs) / 1000);
                return interaction.reply({ content: `💀 Bạn đang hồi sinh... Còn **${secsLeft} giây**.`, flags: MessageFlags.Ephemeral });
            }

            const myStats = await db.queryOne('SELECT * FROM arena_stats WHERE user_id = $1', [userId]);
            const myElo = parseInt(myStats.elo);

            // Matchmaking
            let opponents = await db.queryAll(
                'SELECT * FROM arena_stats WHERE user_id != $1 AND elo >= $2 AND elo <= $3 ORDER BY elo DESC',
                [userId, myElo - 400, myElo + 400]
            );

            if (opponents.length === 0) {
                opponents = await db.queryAll('SELECT * FROM arena_stats WHERE user_id != $1 ORDER BY elo DESC LIMIT 20', [userId]);
            }

            if (opponents.length === 0) {
                return interaction.reply({ content: '🏜️ Đấu trường vắng vẻ...', flags: MessageFlags.Ephemeral });
            }

            const enemyStat = opponents[Math.floor(Math.random() * opponents.length)];
            const enemyPlayer = await db.getPlayer(enemyStat.user_id);

            if (!enemyPlayer) return interaction.reply({ content: '❌ Lỗi đối thủ.', flags: MessageFlags.Ephemeral });

            // Animation
            const battleEmbed = new EmbedBuilder()
                .setTitle('⚔️ Đấu Trường Quyết Chiến')
                .setDescription(`Bạn đang so tài với <@${enemyStat.user_id}> (${PvpService.getRankInfo(enemyStat.elo).name})...`)
                .setColor('#e74c3c')
                .setImage(gifData.arena || null);

            const msg = await interaction.reply({ embeds: [battleEmbed], fetchReply: true });
            
            // Artificial delay for tension
            await new Promise(r => setTimeout(r, 3000));

            // Run Battle
            const result = await PvpService.runBattle(interaction, player, enemyPlayer);
            
            let eloChange = 20;
            if (result.winnerId === userId) {
                await db.execute('UPDATE arena_stats SET elo = elo + $1, wins = wins + 1 WHERE user_id = $2', [eloChange, userId]);
                await db.execute('UPDATE arena_stats SET elo = GREATEST(0, elo - $1), losses = losses + 1 WHERE user_id = $2', [15, enemyStat.user_id]);
                
                const winEmbed = new EmbedBuilder()
                    .setTitle('🏆 CHIẾN THẮNG!')
                    .setColor('#2ecc71')
                    .setDescription(result.log + `\n\n🎉 **KẾT QUẢ:**\nBạn nhận được **+${eloChange} Elo**.`);
                
                return msg.edit({ embeds: [winEmbed] });
            } else {
                await db.execute('UPDATE arena_stats SET elo = GREATEST(0, elo - $1), losses = losses + 1 WHERE user_id = $2', [eloChange, userId]);
                await db.execute('UPDATE arena_stats SET elo = elo + $1, wins = wins + 1 WHERE user_id = $2', [15, enemyStat.user_id]);

                const lossEmbed = new EmbedBuilder()
                    .setTitle('💀 THẤT BẠI!')
                    .setColor('#e74c3c')
                    .setDescription(result.log + `\n\n💀 **KẾT QUẢ:**\nBạn bị trừ **-${eloChange} Elo**.`);
                
                return msg.edit({ embeds: [lossEmbed] });
            }
        }
    }
};
