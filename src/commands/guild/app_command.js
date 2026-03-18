const {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    EmbedBuilder,
} = require('discord.js');
const db = require('../../database');
const itemsData = require('../../utils/itemsData');

module.exports = {
    // Context menu: Click phải vào user → Apps → "📊 Xem Hồ Sơ"
    data: new ContextMenuCommandBuilder()
        .setName('📊 Xem Hồ Sơ')
        .setType(ApplicationCommandType.User),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 }); // ephemeral

        const targetUser = interaction.targetUser ?? interaction.user;
        const userId = targetUser.id;

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.editReply({
                content: `❌ **${targetUser.username}** chưa bắt đầu hành trình RPG!\nHãy dùng \`/start\` hoặc \`$start\` để tạo nhân vật.`,
            });
        }

        // Load thêm stats & equipment
        const [stats, equip] = await Promise.all([
            db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]),
            db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]),
        ]);

        // Xác định class icon
        const classIcons = { Warrior: '⚔️', Ranger: '🏹', Mage: '🔮', Assassin: '🗡️' };
        const classIcon = classIcons[player.class] || '🧙';

        // Thanh HP
        const hpBar = buildBar(player.hp, player.max_hp, '🟥', '⬛', 10);
        const manaBar = buildBar(player.mana, player.max_mana, '🟦', '⬛', 10);

        // Equipment display
        const weapon   = equip?.weapon_id   ? `${getItemName(equip.weapon_id)} +${equip.weapon_upgrade}`   : '_Trống_';
        const armor    = equip?.armor_id    ? `${getItemName(equip.armor_id)} +${equip.armor_upgrade}`    : '_Trống_';
        const accessory = equip?.accessory_id ? `${getItemName(equip.accessory_id)} +${equip.accessory_upgrade}` : '_Trống_';

        // Region display
        const regionNames = {
            whispering_forest: '🌿 Khu Rừng Thì Thầm',
            burning_desert:    '🏜️ Sa Mạc Lửa',
            frozen_mountains:  '🏔️ Núi Tuyết Phủ',
            ancient_ruins:     '🏛️ Phế Tích Cổ Đại',
            lava_caverns:      '🌋 Động Nham Thạch',
            crystal_sanctuary: '💎 Thánh Địa Pha Lê',
            sky_islands:       '☁️ Đảo Trên Mây',
            abyss_ocean:       '🌊 Biển Vực Thẳm',
            the_void:          '🕳️ Hư Vô',
            heavenly_gates:    '👼 Thiên Môn',
        };
        const regionName = regionNames[player.current_region] ?? player.current_region;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${targetUser.username} — Hồ Sơ Phiêu Lưu`, iconURL: targetUser.displayAvatarURL() })
            .setColor('#9b59b6')
            .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
            .addFields(
                { name: `${classIcon} Lớp | Cấp`, value: `**${player.class}** | Lv.**${player.level}**`, inline: true },
                { name: '📍 Vùng Đất', value: regionName, inline: true },
                { name: '🪙 Vàng', value: `${player.gold.toLocaleString()} G`, inline: true },
                { name: `❤️ HP  ${player.hp}/${player.max_hp}`, value: hpBar, inline: false },
                { name: `💧 Mana  ${player.mana}/${player.max_mana}`, value: manaBar, inline: false },
                {
                    name: '⚔️ Chỉ Số',
                    value: `ATK \`${stats?.attack ?? '?'}\` | DEF \`${stats?.defense ?? '?'}\` | AGI \`${stats?.agility ?? '?'}\``,
                    inline: false,
                },
                {
                    name: '🛡️ Trang Bị',
                    value: [
                        `🗡️ Vũ khí: **${weapon}**`,
                        `🛡️ Giáp: **${armor}**`,
                        `💍 Phụ kiện: **${accessory}**`,
                    ].join('\n'),
                    inline: false,
                },
            )
            .setFooter({ text: 'EchoWorld RPG — App Command' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildBar(current, max, fillEmoji, emptyEmoji, size = 10) {
    const filled = Math.round((current / max) * size);
    return fillEmoji.repeat(Math.min(filled, size)) + emptyEmoji.repeat(Math.max(size - filled, 0));
}

function getItemName(itemId) {
    try {
        const data = itemsData.getItem(itemId);
        return data?.name ?? itemId;
    } catch {
        return itemId;
    }
}
