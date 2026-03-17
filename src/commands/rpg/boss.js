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
        if (player.hp <= 0) return interaction.reply({ content: '💀 Bạn đang trọng thương.', flags: require('discord.js').MessageFlags.Ephemeral });

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
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(3000); // Boss roar/battle duration

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

        if (mHp <= 0) {
            // Boss Killed
            mHp = 0;
            await db.execute('UPDATE world_states SET value = $1 WHERE key = $2', [0, `${region}_boss_hp`]);
            await db.execute('UPDATE world_states SET value = $1 WHERE key = $2', [0, `${region}_kills`]); // Reset kill counter

            log += `\n🎉 **WORLD BOSS ĐÃ BỊ TIÊU DIỆT!**\nBạn đã vung đòn kết liễu! Nhận thưởng: 🪙 **${bData.gold} Vàng** & 🌟 **${bData.exp} EXP**.`;

            // Give rewards
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [bData.gold, userId]);
            require('../../utils/questLogic').addProgress(userId, 'kill_boss', 1);
            require('../../utils/questLogic').addProgress(userId, 'earn_gold', bData.gold);

            const expResult = await require('../../utils/rpgLogic').addExp(userId, bData.exp);
            
            if (expResult && expResult.leveledUp) {
                log += `\n🆙 **LÊN CẤP BỨT PHÁ!** Bạn đã trực tiếp phi thăng lên cấp độ ${expResult.newLevel}!`;
            }

            // Give item
            const droppedItem = bData.drops[Math.floor(Math.random() * bData.drops.length)];
            await db.execute(
                'INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', 
                [userId, droppedItem]
            );
            const itemInfo = itemsData.getItem(droppedItem);
            log += `\n🎁 **Rơi Đồ Đặc Biệt!** Nhặt được 1x **${itemInfo.name}** [${itemInfo.rarity}].`;

            // Egg drop logic
            if (Math.random() < 0.50) { // 50% to drop an egg
                await db.execute(
                    "INSERT INTO inventory (user_id, item_id) VALUES ($1, 'egg') ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1", 
                    [userId]
                );
                log += `\n🥚 **Tìm thấy Trứng Thú Rừng!** Con Boss đang bảo vệ một quả trứng bí ẩn.`;
            }

            const winEmbed = new EmbedBuilder().setColor('#FFD700').setDescription(log);
            return msg.edit({ content: '@everyone', embeds: [winEmbed] }); // Announce kill
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
            log += `\n💀 **Gục Ngã!** Sức mạnh của Boss là quá sức tưởng tượng.`;
            await db.execute('UPDATE players SET hp = 0 WHERE user_id = $1', [userId]);
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

