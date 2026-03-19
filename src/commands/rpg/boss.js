const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const bossData = require('../../utils/bossData');
const itemsData = require('../../utils/itemsData');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'RPG',
    aliases: ['b', 'bo'],
    data: new SlashCommandBuilder()
        .setName('boss')
        .setDescription('Tấn công World Boss ở khu vực hiện tại'),
    help: {
        usage: '/boss',
        examples: ['/boss', '$b'],
        description: 'Tấn công World Boss xuất hiện tại vùng đất hiện tại. Boss chỉ xuất hiện khi người chơi trong vùng đất đó tiêu diệt đủ số lượng quái vật yêu cầu. Hạ gục boss mang lại Vàng, EXP cực lớn và trang bị Hiếm/Legendary.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        
        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa chọn Class! Gõ `/start`.', flags: require('discord.js').MessageFlags.Ephemeral });

        // Respawn check
        const nowMs = Date.now();
        if (player.dead_until && player.dead_until > nowMs) {
            const secsLeft = Math.ceil((player.dead_until - nowMs) / 1000);
            const mins = Math.floor(secsLeft / 60);
            const secs = secsLeft % 60;
            return interaction.reply({ content: `💀 Bạn đang hồi sinh... Còn **${mins} phút ${secs} giây** nữa.`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        const region = player.current_region;
        const bData = bossData[region];
        if (!bData) return interaction.reply({ content: 'Khu vực này không có Boss.', flags: require('discord.js').MessageFlags.Ephemeral });

        // Check Boss HP
        const bossHpState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${region}_boss_hp`]);
        const currentHp = bossHpState ? parseInt(bossHpState.value) : 0;

        if (currentHp <= 0) {
            const killsState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${region}_kills`]);
            const currentKills = killsState ? parseInt(killsState.value) : 0;
            return interaction.reply({ 
                content: `🕊️ World Boss **${bData.name}** chưa xuất hiện hoặc đã bị tiêu diệt.\n(Tiến trình spawn: ${currentKills}/${bData.spawn_req} quái vật đã bị hạ)`, 
                flags: require('discord.js').MessageFlags.Ephemeral 
            });
        }

        // Battle Animation
        const battleEmbed = new EmbedBuilder()
            .setTitle(`⚔️ Đại Chiến World Boss: ${bData.name}`)
            .setDescription(`Bạn đang chuẩn bị đòn tấn công vào **${bData.name}**...`)
            .setColor('#9b59b6')
            .setImage(gifData.boss);

        const msg = await interaction.reply({ embeds: [battleEmbed], fetchReply: true });
        // Removed artificial 3s sleep to make attacking faster, or keep 1s
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(1000); // Shorter duration to not rate limit too hard

        // --- Battle Logic ---
        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);

        let log = '';
        let mHp = currentHp;
        let pHp = player.hp;

        // Player attacks
        let pDmg = stats.attack;
        if (Math.random() < stats.crit_rate) {
            pDmg = Math.floor(pDmg * stats.crit_damage);
            log += `💥 Chí mạng! Bạn tung đòn chém **${pDmg}** sát thương vào ${bData.name}.\n`;
        } else {
            log += `🗡️ Bạn tấn công gây ra **${pDmg}** sát thương.\n`;
        }
        mHp -= pDmg;

        // Track damage in world_states
        const dmgKey = `${region}_boss_dmg_${userId}`;
        const currentDmgRecord = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [dmgKey]);
        let totalDmg = currentDmgRecord ? parseInt(currentDmgRecord.value) : 0;
        totalDmg += pDmg;
        await db.execute(
            'INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [dmgKey, totalDmg.toString()]
        );

        if (mHp <= 0) {
            // Boss Killed
            mHp = 0;
            await db.execute('UPDATE world_states SET value = $1 WHERE key = $2', [0, `${region}_boss_hp`]);
            await db.execute('UPDATE world_states SET value = $1 WHERE key = $2', [0, `${region}_kills`]); // Reset kill counter

            log += `\n🎉 **WORLD BOSS ĐÃ BỊ TIÊU DIỆT TẠI ${bData.name.toUpperCase()}!**\nNgười kết liễu: <@${userId}>.\n\n🏆 **Bảng Xếp Hạng Sát Thương:**\n`;

            // Calculate Leaderboard
            const allDmgRecords = await db.queryAll(`SELECT key, value FROM world_states WHERE key LIKE '${region}_boss_dmg_%'`);
            
            let participants = allDmgRecords.map(r => {
                const parts = r.key.split('_');
                const pId = parts[parts.length - 1];
                return { userId: pId, dmg: parseInt(r.value) };
            }).sort((a, b) => b.dmg - a.dmg);

            // Give rewards based on rank
            for (let i = 0; i < participants.length; i++) {
                const p = participants[i];
                let rankMult = 0.2; // Default participation (20%)
                if (i === 0) rankMult = 1.0; // Top 1: 100%
                else if (i === 1) rankMult = 0.7; // Top 2: 70%
                else if (i === 2) rankMult = 0.5; // Top 3: 50%

                const pGold = Math.floor(bData.gold * rankMult);
                const pExp = Math.floor(bData.exp * rankMult);

                // Need a direct db call since we shouldn't broadcast to offline players right here, just update their DB
                await db.execute('UPDATE players SET gold = gold + $1, exp = exp + $2 WHERE user_id = $3', [pGold, pExp, p.userId]);
                require('../../utils/levelLogic').checkLevelUp(p.userId); // Async check level up
                require('../../utils/questLogic').addProgress(p.userId, 'kill_boss', 1);

                // Top 3 gets items/eggs chance
                if (i < 3) {
                    const droppedItem = bData.drops[Math.floor(Math.random() * bData.drops.length)];
                    await db.execute(
                        'INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', 
                        [p.userId, droppedItem]
                    );
                    if (Math.random() < 0.5) {
                        await db.execute(
                            "INSERT INTO inventory (user_id, item_id) VALUES ($1, 'egg') ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1", 
                            [p.userId]
                        );
                    }
                }

                if (i < 5) {
                    log += `**Top ${i+1}:** <@${p.userId}> — 💥 ${p.dmg.toLocaleString()} DMG (Nhận ${pGold} Vàng, ${pExp} EXP)\n`;
                }
            }

            if (participants.length > 5) {
                log += `...và ${participants.length - 5} chiến binh khác cũng nhận được phần thưởng tham gia!\n`;
            }

            // Cleanup dmg records
            await db.execute(`DELETE FROM world_states WHERE key LIKE '${region}_boss_dmg_%'`);

            const winEmbed = new EmbedBuilder().setColor('#FFD700').setDescription(log);
            return msg.edit({ content: '@everyone 📢 **TIN NÓNG MẶT TRẬN!**', embeds: [winEmbed] }); 
        } else {
            // Update Boss HP
            await db.execute('UPDATE world_states SET value = $1 WHERE key = $2', [mHp, `${region}_boss_hp`]);
        }

        // Boss attacks back
        let mDmg = Math.max(1, bData.atk - Math.floor(stats.defense / 2));
        log += `🩸 Boss càn quét, gây ra **${mDmg}** sát thương diện rộng chí mạng lên bạn.\n`;
        pHp -= mDmg;

        if (pHp <= 0) {
            pHp = 0;
            const RESPAWN_MS = 5 * 60 * 1000;
            const deadUntil = Date.now() + RESPAWN_MS;
            log += `\n💀 **Gục Ngã!** Sức mạnh của Boss là quá sức tưởng tượng. Hồi sinh sau **5 phút**.`;
            await db.execute('UPDATE players SET hp = 0, dead_until = $1 WHERE user_id = $2', [deadUntil, userId]);
            const loseEmbed = new EmbedBuilder().setColor('#000000').setDescription(log);
            return msg.edit({ embeds: [loseEmbed] });
        }

        await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [pHp, userId]);

        const nextTurnEmbed = new EmbedBuilder()
            .setTitle(`⚔️ Đại Chiến World Boss!`)
            .setDescription(log)
            .setColor('#9b59b6')
            .addFields(
                { name: bData.name, value: `❤️ HP: ${mHp}/${bData.max_hp}`, inline: true },
                { name: 'Của bạn', value: `❤️ HP: ${pHp}/${player.max_hp}`, inline: true }
            );

            return msg.edit({ embeds: [nextTurnEmbed] });
    }
};

