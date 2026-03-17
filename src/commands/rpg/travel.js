const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database');
const gifData = require('../../utils/gifData');
const rpgData = require('../../utils/rpgData');

// Min level requirement per region
const REGION_MIN_LEVELS = {
    whispering_forest: 1,
    burning_desert: 20,
    frozen_mountains: 50,
    abyss_ocean: 80,
    ancient_ruins: 150,
    sky_islands: 200,
    the_void: 300,
    lava_caverns: 250,
    crystal_sanctuary: 400,
    heavenly_gates: 600
};

module.exports = {
    category: 'RPG',
    aliases: ['t', 'tr', 'map'],
    data: new SlashCommandBuilder()
        .setName('travel')
        .setDescription('Di chuyển đến một khu vực khác trên thế giới'),
    help: {
        usage: '/travel',
        examples: ['/travel', '$t', '$map'],
        description: 'Mở bản đồ thế giới và chọn vùng đất muốn di chuyển tới. Mỗi vùng hiển thị cấp độ tối thiểu yêu cầu.'
    },
    async execute(interaction) {
        const { MessageFlags } = require('discord.js');
        const userId = interaction.user.id;

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này. Hãy dùng lệnh `/start` trước!', flags: MessageFlags.Ephemeral });
        }

        const validRegions = Object.keys(rpgData).filter(key => typeof rpgData[key] === 'object' && rpgData[key].monsters);
        const options = validRegions.map(key => {
            const regionInfo = rpgData[key];
            const minLevel = REGION_MIN_LEVELS[key] || 1;
            const isCurrent = key === player.current_region;
            const canEnter = player.level >= minLevel;
            const label = `${regionInfo.name}${isCurrent ? ' ← Hiện tại' : ''}`;
            const desc = `Yêu cầu Lv.${minLevel}${canEnter ? '' : ' ⛔ Cấp chưa đủ'}`;
            return { label, description: desc, value: key };
        });

        const embed = new EmbedBuilder()
            .setTitle('🗺️ Bản Đồ Thế Giới EchoWorld')
            .setDescription(`📍 Vị trí hiện tại: **${rpgData[player.current_region]?.name || player.current_region}**\n⚔️ Cấp độ của bạn: **Lv.${player.level}**\n\nChọn vùng đất muốn di chuyển. Vùng yêu cầu cấp cao hơn của bạn sẽ được đánh dấu ⛔.`)
            .setColor('#f1c40f')
            .addFields(
                validRegions.map(key => ({
                    name: rpgData[key].name,
                    value: `Lv.${REGION_MIN_LEVELS[key] || 1}+ | ${rpgData[key].monsters.length} quái vật`,
                    inline: true
                }))
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_region')
                    .setPlaceholder('Chọn Vùng Đất')
                    .addOptions(options.slice(0, 25)), // Discord limit
            );

        const response = await interaction.reply({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 30000 });

        collector.on('collect', async i => {
            const selectedRegion = i.values[0];
            const regionName = rpgData[selectedRegion].name;
            const minLevel = REGION_MIN_LEVELS[selectedRegion] || 1;

            if (player.level < minLevel) {
                return i.reply({ content: `⛔ Bạn cần đạt **Lv.${minLevel}** mới có thể vào **${regionName}**!`, flags: MessageFlags.Ephemeral });
            }

            if (selectedRegion === player.current_region) {
                return i.reply({ content: `📍 Bạn đang ở **${regionName}** rồi!`, flags: MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE players SET current_region = $1 WHERE user_id = $2', [selectedRegion, userId]);

            // Travel Animation
            const travelEmbed = new EmbedBuilder()
                .setTitle('✈️ Đang Di Chuyển...')
                .setDescription(`Bạn đang bắt đầu hành trình đến **${regionName}**...`)
                .setColor('#3498db')
                .setImage(gifData.travel);

            await i.update({ embeds: [travelEmbed], components: [] });
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await sleep(3000);

            const successEmbed = new EmbedBuilder()
                .setTitle('✈️ Đã Đến Nơi!')
                .setDescription(`✅ Bạn đã di chuyển đến **${regionName}** (Lv.${minLevel}+).\n\nDùng lệnh \`/explore\` để bắt đầu khám phá!`)
                .setColor('#2ecc71');

            await i.editReply({ embeds: [successEmbed] });
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '⏱️ Đã hết thời gian chọn địa điểm. Vui lòng gõ lại lệnh.', components: [] });
            }
        });
    },
};
