const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const db = require('../../database');
const rpgData = require('../../utils/rpgData');
const gifData = require('../../utils/gifData');
const sessionManager = require('../../utils/sessionManager');
const path = require('path');

module.exports = {
    category: 'RPG',
    aliases: ['e', 'ex'],
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Bắt đầu hoặc tiếp tục hành trình thám hiểm'),
    help: {
        usage: '/explore',
        examples: ['/explore', '$e', '$ex'],
        description: 'Thám hiểm vùng đất hiện tại. Bạn sẽ tiến sâu vào các tầng, mỗi tầng có quái vật hoặc sự kiện. Bạn có thể chọn tiếp tục để nhận thưởng lớn hơn hoặc rút lui để bảo toàn tính mạng.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        
        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({ content: '❌ Bạn chưa có nhân vật! Gõ `/start` để bắt đầu.', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        // Basic HP/Death check
        if (player.hp <= 0 || (player.dead_until && player.dead_until > Date.now())) {
            const nowCheck = Date.now();
            if (player.dead_until && player.dead_until > nowCheck) {
                const secsLeft = Math.ceil((player.dead_until - nowCheck) / 1000);
                return interaction.reply({ content: `💀 Bạn đang hồi sinh... Còn **${Math.ceil(secsLeft/60)} phút** nữa.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }
            await db.execute('UPDATE players SET hp = max_hp, dead_until = 0 WHERE user_id = $1', [userId]);
            player.hp = player.max_hp;
        }

        let session = sessionManager.getSession(userId);

        if (session) {
            // Check if player is already in a monster encounter
            if (session.monster) {
                return interaction.reply({ content: '⚔️ Bạn đang trong trận chiến! Hãy kết thúc nó trước.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle(`🗺️ Hành Trình Tại ${rpgData[session.region].name}`)
                .setDescription(`Bạn đang ở **Tầng ${session.progress + 1}**.\n\n` +
                    `❤️ **HP:** ${player.hp}/${player.max_hp}\n` +
                    `💰 **Vàng tích lũy:** ${session.accumulatedRewards.gold}\n` +
                    `🌟 **EXP tích lũy:** ${session.accumulatedRewards.exp}`)
                .setColor('#f1c40f')
                .setThumbnail(gifData.explore);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('session_continue').setLabel('Tiến Tới').setStyle(ButtonStyle.Primary).setEmoji('👣'),
                    new ButtonBuilder().setCustomId('session_heal').setLabel('Nghỉ Ngơi').setStyle(ButtonStyle.Success).setEmoji('⛺'),
                    new ButtonBuilder().setCustomId('session_finish').setLabel('Rút Lui').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        } else {
            // Start new session
            const cooldown = 10000; // 10s start cooldown
            if (Date.now() - (player.last_explore || 0) < cooldown) {
                const secs = Math.ceil((cooldown - (Date.now() - player.last_explore)) / 1000);
                return interaction.reply({ content: `⏳ Bạn cần nghỉ ngơi **${secs} giây** trước khi bắt đầu hành trình mới.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            session = sessionManager.getOrCreateSession(userId, {
                region: player.current_region,
                hp: player.hp,
                maxHp: player.max_hp,
                statusEffects: player.status_effects
            });

            await db.execute('UPDATE players SET last_explore = $1 WHERE user_id = $2', [Date.now(), userId]);

            const embed = new EmbedBuilder()
                .setTitle('🚀 Bắt Đầu Hành Trình')
                .setDescription(`Bạn đã chuẩn bị hành trang và tiến vào **${rpgData[session.region].name}**!`)
                .setColor('#3498db')
                .setImage(gifData.explore);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('session_continue').setLabel('Bắt Đầu Tầng 1').setStyle(ButtonStyle.Primary).setEmoji('⚔️')
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        }
    },
};

