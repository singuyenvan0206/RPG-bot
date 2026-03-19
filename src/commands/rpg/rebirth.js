const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const equipCmd = require('./equip');

module.exports = {
    category: 'Progression',
    aliases: ['rb'],
    data: new SlashCommandBuilder()
        .setName('rebirth')
        .setDescription('Chuyển sinh nhân vật khi đạt mốc Cấp 100'),
    help: {
        usage: '/rebirth',
        examples: ['/rebirth', '$rb'],
        description: 'Chuyển sinh sẽ đặt lại Cấp Độ về 1, nhưng bù lại bạn nhận được +10% Chỉ số cơ bản vĩnh viễn mỗi lần Rebirth. Trang bị, Vàng và Túi đồ được giữ nguyên.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);

        if (!player) {
            return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        if (player.level < 100) {
            const need = 100 - player.level;
            return interaction.reply({
                content: `❌ Bạn chưa đủ điều kiện Chuyển Sinh! Cần đạt **Cấp 100**. (Còn ${need} cấp nữa)`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        // Confirmation could be added here, but let's keep it simple for now or use buttons
        // Let's directly rebirth
        const currentRebirths = player.rebirths || 0;
        const newRebirths = currentRebirths + 1;

        const multiplier = 1 + (newRebirths * 0.1);
        const newMaxHp = Math.floor(100 * multiplier);
        const newMaxMana = Math.floor(50 * multiplier);

        // Reset level, exp, increase rebirths, and properly reset/scale HP & Mana
        await db.execute(
            'UPDATE players SET level = 1, exp = 0, hp = $1, max_hp = $1, mana = $2, max_mana = $2, rebirths = $3 WHERE user_id = $4',
            [newMaxHp, newMaxMana, newRebirths, userId]
        );

        // Recalculate stats with new rebirth multiplier
        await equipCmd.recalculateStats(userId);

        const newBuffPct = newRebirths * 10;
        const newCritBuff = newRebirths * 1;

        const embed = new EmbedBuilder()
            .setTitle('🌟 TIẾN HÓA CHUYỂN SINH! 🌟')
            .setDescription(`Chúc mừng **<@${userId}>**! Ánh sáng chói lóa bao trùm lấy cơ thể bạn. Bạn đã bước sang một chiều không gian sức mạnh mới!`)
            .setColor('#f1c40f')
            .addFields(
                { name: '🔥 Số lần Chuyển Sinh', value: `**${newRebirths}**`, inline: true },
                { name: '🔻 Cấp độ', value: `100 ➡️ **1**`, inline: true },
                { name: '✨ Sức mạnh thức tỉnh', value: `Tất cả chỉ số (HP/ATK/DEF/AGI) vĩnh viễn tăng **+${newBuffPct}%**!\nTỉ lệ Bạo Kích tăng **+${newCritBuff}%**!`, inline: false }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1090623323097874532/1109151528654032997/rebirth_icon.gif') // Example placeholder or just use a standard icon
            .setFooter({ text: 'Hành trình mới lại bắt đầu...' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
