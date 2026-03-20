const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database');
const bossData = require('../../utils/bossData');
const rpgData = require('../../utils/rpgData');
const { createHealthBar } = require('../../utils/uiHelper');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'RPG',
    data: new SlashCommandBuilder()
        .setName('boss')
        .setDescription('Xem và tham gia tiêu diệt Boss Khu Vực'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: 'Bạn chưa có nhân vật!', flags: require('discord.js').MessageFlags.Ephemeral });

        const regionId = player.current_region;
        const boss = bossData[regionId];
        if (!boss) return interaction.reply({ content: 'Vùng này không có Boss.', flags: require('discord.js').MessageFlags.Ephemeral });

        const hpState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${regionId}_boss_hp`]);
        const currentHp = hpState ? parseInt(hpState.value) : 0;

        if (currentHp <= 0) {
            const killsState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${regionId}_kills`]);
            const currentKills = killsState ? parseInt(killsState.value) : 0;
            
            const embed = new EmbedBuilder()
                .setTitle(`🏰 Boss ${rpgData[regionId].name}`)
                .setDescription(`Boss hiện đang **Ẩn Mình**.\n\nTiến trình triệu hồi: **${currentKills}/${boss.spawn_req}** quái vật đã bị tiêu diệt tại vùng này.`)
                .setColor('#95a5a6')
                .setFooter({ text: 'Hãy cùng mọi người tiêu diệt thêm quái vật để Boss xuất hiện!' });
            
            return interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🆘 CẢNH BÁO BOSS: ${boss.name}`)
            .setDescription(`Boss đang tàn phá **${rpgData[regionId].name}**!\n\n${createHealthBar(currentHp, boss.max_hp)}\n**HP:** ${currentHp}/${boss.max_hp}`)
            .setColor('#e74c3c')
            .setImage(gifData.boss_spawn || gifData.explore) // Fallback
            .addFields(
                { name: 'Sức mạnh', value: `🗡️ ATK: ${boss.atk}`, inline: true },
                { name: 'Phần thưởng', value: `💰 ${boss.gold} Vàng | 🌟 ${boss.exp} EXP`, inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`boss_attack_${regionId}`).setLabel('Tấn Công Boss').setStyle(ButtonStyle.Danger).setEmoji('⚔️')
            );

        return interaction.reply({ embeds: [embed], components: [row] });
    },
};
