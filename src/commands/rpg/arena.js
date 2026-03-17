const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const gifData = require('../../utils/gifData');

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
        if (!player) return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: require('discord.js').MessageFlags.Ephemeral });

        // Ensure arena stats exist
        await db.execute(
            'INSERT INTO arena_stats (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
            [userId]
        );

        if (sub === 'rank') {
            const myStats = await db.queryOne('SELECT * FROM arena_stats WHERE user_id = $1', [userId]);
            const topStats = await db.queryAll('SELECT * FROM arena_stats ORDER BY elo DESC, wins DESC LIMIT 5');

            const embed = new EmbedBuilder()
                .setTitle('🏆 Đấu Trường Hắc Ám: Bảng Xếp Hạng')
                .setColor('#e67e22')
                .setDescription(`Bạn đang có **${myStats.elo} Elo** (Thắng: ${myStats.wins} | Thua: ${myStats.losses})\n\n**TOP 5 SERVER:**`);

            topStats.forEach((t, i) => {
                embed.addFields({
                    name: `Hạng ${i + 1}`,
                    value: `<@${t.user_id}> - Điểm Elo: **${t.elo}** (Thắng: ${t.wins})`
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'match') {
            const myStats = await db.queryOne('SELECT * FROM arena_stats WHERE user_id = $1', [userId]);
            const myElo = parseInt(myStats.elo);

            // Find opponents within +/- 300 Elo, excluding self
            let opponents = await db.queryAll(
                'SELECT * FROM arena_stats WHERE user_id != $1 AND elo >= $2 AND elo <= $3 ORDER BY elo DESC',
                [userId, myElo - 300, myElo + 300]
            );

            // If no match found in bracket, just pick anyone
            if (opponents.length === 0) {
                opponents = await db.queryAll('SELECT * FROM arena_stats WHERE user_id != $1 ORDER BY elo DESC LIMIT 20', [userId]);
            }

            if (opponents.length === 0) {
                return interaction.reply({ content: '🏜️ Đấu trường trống vắng. Không tìm thấy đối thủ nào!', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const enemy = opponents[Math.floor(Math.random() * opponents.length)];
            const enemyId = enemy.user_id;

            // Load combat stats
            const myCombat = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);
            const enemyCombat = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [enemyId]);
            const enemyPlayer = await db.getPlayer(enemyId); // Need Max HP for arena

            if (!myCombat || !enemyCombat || !enemyPlayer) {
                return interaction.reply({ content: '❌ Đối thủ bị lỗi dữ liệu chiến đấu. Thử lại sau.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Battle Animation
            const battleEmbed = new EmbedBuilder()
                .setTitle('⚔️ Đấu Trường Quyết Chiến')
                .setDescription(`Bạn và <@${enemyId}> đang lao vào nhau...`)
                .setColor('#e74c3c')
                .setImage(gifData.arena);

            const msg = await interaction.reply({ embeds: [battleEmbed], fetchReply: true });
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await sleep(3500); // GIF duration

            // AUTO BATTLE LOGIC
            let myHp = player.max_hp;
            let enHp = enemyPlayer.max_hp;
            let log = `Bạn đã thách đấu <@${enemyId}> (Elo: ${enemy.elo})\n\n`;

            let turn = 1;
            let winnerId = null;

            while (myHp > 0 && enHp > 0 && turn <= 10) {
                // My Turn
                let myDmg = myCombat.attack;
                if (Math.random() < myCombat.crit_rate) {
                    myDmg = Math.floor(myDmg * myCombat.crit_damage);
                }
                let realDmgToEn = Math.max(1, myDmg - Math.floor(enemyCombat.defense / 2));
                enHp -= realDmgToEn;

                if (enHp <= 0) {
                    log += `Đòn kết liễu! Bạn đâm trúng tim đối thủ với **${realDmgToEn}** sát thương.\n`;
                    winnerId = userId;
                    break;
                }

                // Enemy Turn
                let enDmg = enemyCombat.attack;
                if (Math.random() < enemyCombat.crit_rate) {
                    enDmg = Math.floor(enDmg * enemyCombat.crit_damage);
                }
                let realDmgToMe = Math.max(1, enDmg - Math.floor(myCombat.defense / 2));
                myHp -= realDmgToMe;

                if (myHp <= 0) {
                    log += `Chí mạng! Đối thủ phản công bằng đòn **${realDmgToMe}** sát thương hạ gục bạn.\n`;
                    winnerId = enemyId;
                    break;
                }
                turn++;
            }

            // If 10 turns pass and nobody dies, highest HP % wins
            if (!winnerId) {
                const myHpPct = myHp / player.max_hp;
                const enHpPct = enHp / enemyPlayer.max_hp;
                if (myHpPct >= enHpPct) winnerId = userId;
                else winnerId = enemyId;
                log += `Trận chiến kéo dài quá lâu! Trọng tài xử thắng dựa theo lượng máu còn lại.\n`;
            }

            let embedColor = '#e74c3c';
            if (winnerId === userId) {
                // I won
                const eloWon = 25;
                const eloLost = 15;
                log += `\n🎉 **BẠN ĐÃ CHIẾN THẮNG!**\nBạn được cộng **+${eloWon} Elo**. Đối thủ bị trừ **-${eloLost} Elo**.`;
                embedColor = '#2ecc71';
                
                await db.execute('UPDATE arena_stats SET elo = elo + $1, wins = wins + 1 WHERE user_id = $2', [eloWon, userId]);
                await db.execute('UPDATE arena_stats SET elo = GREATEST(0, elo - $1), losses = losses + 1 WHERE user_id = $2', [eloLost, enemyId]);

            } else {
                // I lost
                const eloLost = 20;
                const eloWon = 20;
                log += `\n💀 **BẠN ĐÃ BẠI TRẬN!**\nBạn bị trừ **-${eloLost} Elo**. Đối thủ được cộng **+${eloWon} Elo**.`;
                
                await db.execute('UPDATE arena_stats SET elo = GREATEST(0, elo - $1), losses = losses + 1 WHERE user_id = $2', [eloLost, userId]);
                await db.execute('UPDATE arena_stats SET elo = elo + $1, wins = wins + 1 WHERE user_id = $2', [eloWon, enemyId]);
            }

            return msg.edit({ embeds: [embed] });
        }
    }
};

