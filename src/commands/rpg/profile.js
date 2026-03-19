const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const itemsData = require('../../utils/itemsData');
const petsData = require('../../utils/petsData');
const { createHealthBar } = require('../../utils/uiHelper');

module.exports = {
    category: 'RPG',
    aliases: ['p', 'pro', 'stats'],
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin chi tiết nhân vật và trang bị đang mặc')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Xem hồ sơ của người chơi khác (tùy chọn)')
                .setRequired(false)
        ),
    help: {
        usage: '/profile [@user]',
        examples: ['/profile', '/profile @someone', '$p'],
        description: 'Hiển thị hồ sơ nhân vật. Có thể xem hồ sơ của người khác bằng cách tag họ.'
    },
    async execute(interaction) {
        const { MessageFlags } = require('discord.js');
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        const isSelf = targetUser.id === interaction.user.id;

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({
                content: isSelf
                    ? '❌ Bạn chưa tham gia thế giới này. Hãy dùng lệnh `/start` trước!'
                    : `❌ **${targetUser.username}** chưa tham gia thế giới EchoWorld.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);

        // Format equip
        let equipText = '';
        if (equip) {
            const w = equip.weapon_id ? itemsData.getItem(equip.weapon_id) : null;
            const a = equip.armor_id ? itemsData.getItem(equip.armor_id) : null;
            const ac = equip.accessory_id ? itemsData.getItem(equip.accessory_id) : null;
            const p = equip.pet_id ? petsData.getPet(equip.pet_id) : null;

            equipText += `⚔️ **Vũ khí**: ${w ? `${w.name} [+${equip.weapon_upgrade || 0}]` : '*Trống*'}\n`;
            equipText += `🛡️ **Áo giáp**: ${a ? `${a.name} [+${equip.armor_upgrade || 0}]` : '*Trống*'}\n`;
            equipText += `💍 **Phụ kiện**: ${ac ? `${ac.name} [+${equip.accessory_upgrade || 0}]` : '*Trống*'}\n`;
            if (p) equipText += `🐾 **Thú Cưng**: ${p.name}`;
        } else {
            equipText = 'Chưa mặc đồ nào.';
        }

        const learnedSkills = await db.getPlayerSkills(userId);
        const skillsData = require('../../utils/skillsData');
        let skillsText = '';
        if (learnedSkills && learnedSkills.length > 0) {
            learnedSkills.forEach(ls => {
                const classSkills = skillsData[player.class];
                const data = classSkills ? classSkills.find(s => s.id === ls.skill_id) : null;
                if (data) skillsText += `• **${data.name}** [Lv.${ls.level}]\n`;
            });
        } else {
            skillsText = '*Chưa học kĩ năng nào.*';
        }

        const regionName = require('../../utils/rpgData')[player.current_region]?.name || player.current_region;
        const expNeeded = 150 + (player.level * 100);

        const embed = new EmbedBuilder()
            .setTitle(`👤 Hồ Sơ: ${targetUser.username}`)
            .setColor('#3498db')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📋 Thông tin', value: `**Class**: ${player.class}\n**Level**: ${player.level}\n**Vị trí**: ${regionName}`, inline: true },
                { name: '💰 Tài sản', value: `🪙 **${player.gold.toLocaleString()}** Vàng`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: '✨ EXP', value: createHealthBar(player.exp, expNeeded, '🌟'), inline: false },
                { name: '❤️ HP', value: createHealthBar(player.hp, player.max_hp), inline: false },
                { name: '🧪 Mana', value: createHealthBar(player.mana, player.max_mana, '🧪'), inline: false },
                { name: '⚔️ Chỉ số chiến đấu', value: `**ATK**: ${stats?.attack || 0} | **DEF**: ${stats?.defense || 0} | **AGI**: ${stats?.agility || 0} | **Bạo kích**: ${((stats?.crit_rate || 0) * 100).toFixed(0)}%`, inline: false },
                { name: '🔮 Kĩ năng', value: skillsText, inline: false },
                { name: '🛡️ Trang bị', value: equipText, inline: false }
            )
            .setFooter({ text: '💡 /inventory — Xem túi đồ | /equip — Thay trang bị | /shop — Mua sắm' });

        await interaction.reply({ embeds: [embed] });
    },
};
