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
    lava_caverns: 250,
    the_void: 300,
    crystal_sanctuary: 400,
    heavenly_gates: 600
};

// Order of regions for progression
const REGION_ORDER = [
    'whispering_forest',
    'burning_desert',
    'frozen_mountains',
    'abyss_ocean',
    'ancient_ruins',
    'sky_islands',
    'lava_caverns',
    'the_void',
    'crystal_sanctuary',
    'heavenly_gates'
];

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
        
        // Fetch progress for all regions
        const explorationProgress = await db.queryAll('SELECT region_id, max_floor FROM player_exploration WHERE user_id = $1', [userId]);
        const progressMap = explorationProgress.reduce((acc, curr) => {
            acc[curr.region_id] = curr.max_floor;
            return acc;
        }, {});

        const options = validRegions.map(key => {
            const regionInfo = rpgData[key];
            const minLevel = REGION_MIN_LEVELS[key] || 1;
            const isCurrent = key === player.current_region;
            
            // Check if UNLOCKED
            let isUnlocked = true;
            let lockReason = '';
            
            const regionIndex = REGION_ORDER.indexOf(key);
            if (regionIndex > 0) {
                const prevRegionKey = REGION_ORDER[regionIndex - 1];
                const prevRegionInfo = rpgData[prevRegionKey];
                const prevMaxFloor = progressMap[prevRegionKey] || 0;
                
                if (prevMaxFloor < prevRegionInfo.monsters.length * 3) {
                    isUnlocked = false;
                    lockReason = `Cần mốc thám hiểm ${prevRegionInfo.name} Tầng ${prevRegionInfo.monsters.length * 3}`;
                }
            }
            
            const levelEnough = player.level >= minLevel;
            if (!levelEnough) {
                isUnlocked = false;
                lockReason = lockReason ? `${lockReason} & Cấp ${minLevel}` : `Cần đạt Cấp ${minLevel}`;
            }

            const label = `${regionInfo.name}${isCurrent ? ' ← Hiện tại' : ''}`;
            const desc = isUnlocked ? `Cấp ${minLevel}+ | Sẵn sàng` : `⛔ ${lockReason}`;
            return { label, description: desc.substring(0, 100), value: key, emoji: isUnlocked ? '✅' : '🔒' };
        });

        const embed = new EmbedBuilder()
            .setTitle('🗺️ Bản Đồ Thế Giới EchoWorld')
            .setDescription(`📍 Vị trí hiện tại: **${rpgData[player.current_region]?.name || player.current_region}**\n⚔️ Cấp độ của bạn: **Lv.${player.level}**\n\n**Điều kiện mở vùng đất:**\n1️⃣ Đạt cấp độ tối thiểu.\n2️⃣ Đã thám hiểm đủ sâu ở vùng đất trước đó (Số tầng = Số loại quái vật).`)
            .setColor('#f1c40f');

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
            const regionInfo = rpgData[selectedRegion];
            const regionName = regionInfo.name;
            const minLevel = REGION_MIN_LEVELS[selectedRegion] || 1;

            // Re-check logic for security
            if (player.level < minLevel) {
                return i.reply({ content: `⛔ Bạn cần đạt **Lv.${minLevel}** mới có thể vào **${regionName}**!`, flags: MessageFlags.Ephemeral });
            }

            const regionIndex = REGION_ORDER.indexOf(selectedRegion);
            if (regionIndex > 0) {
                const prevRegionKey = REGION_ORDER[regionIndex - 1];
                const prevRegionInfo = rpgData[prevRegionKey];
                const progress = await db.queryOne('SELECT max_floor FROM player_exploration WHERE user_id = $1 AND region_id = $2', [userId, prevRegionKey]);
                const maxFloor = progress ? progress.max_floor : 0;

                if (maxFloor < prevRegionInfo.monsters.length * 3) {
                    return i.reply({ content: `🔒 Bạn cần thám hiểm sâu hơn ở **${prevRegionInfo.name}** mới có thể mở khóa vùng đất này! (Cần hoàn thành tất cả mức độ khó - Tầng ${prevRegionInfo.monsters.length * 3})`, flags: MessageFlags.Ephemeral });
                }
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
