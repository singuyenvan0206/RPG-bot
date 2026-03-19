const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const db = require('../../database');
const rpgData = require('../../utils/rpgData');
const path = require('path');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'RPG',
    aliases: ['e', 'ex'],
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Tiến vào thế giới hoang dã để tìm kiếm quái vật hoặc báu vật'),
    help: {
        usage: '/explore',
        examples: ['/explore', '$e', '$ex'],
        description: 'Thám hiểm vùng đất hiện tại của bạn. Có 70% tỉ lệ gặp quái vật để chiến đấu và 30% tỉ lệ gặp các sự kiện ngẫu nhiên (nhận vàng, hồi máu, hoặc dẫm bẫy). Mỗi lần thám hiểm tốn 15 giây hồi chiêu.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        
        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({ content: '❌ Bạn chưa chọn Class! Gõ `/start` trước.', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        if (player.hp <= 0 || (player.dead_until && player.dead_until > 0)) {
            const nowCheck = Date.now();
            if (player.dead_until && player.dead_until > nowCheck) {
                const secsLeft = Math.ceil((player.dead_until - nowCheck) / 1000);
                const mins = Math.floor(secsLeft / 60);
                const secs = secsLeft % 60;
                return interaction.reply({
                    content: `💀 Bạn đang hồi sinh... Còn **${mins} phút ${secs} giây** nữa trước khi tỉnh dậy.`,
                    flags: require('discord.js').MessageFlags.Ephemeral
                });
            }
            // Timer đã hết → tự hồi HP đầy
            await db.execute('UPDATE players SET hp = max_hp, dead_until = 0 WHERE user_id = $1', [userId]);
            player.hp = player.max_hp;
        }

        const now = Date.now();
        // Cooldown 15 giây mỗi lần explore
        if (now - player.last_explore < 15000) {
            const timeLeft = Math.ceil((15000 - (now - player.last_explore)) / 1000);
            return interaction.reply({ content: `⏳ Bước chân bạn đã mỏi mệt. Hãy nghỉ ngơi thêm **${timeLeft} giây** nữa để thám hiểm tiếp.`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        await db.execute('UPDATE players SET last_explore = $1 WHERE user_id = $2', [now, userId]);
        require('../../utils/questLogic').addProgress(userId, 'explore', 1);

        const regionData = rpgData[player.current_region];
        if (!regionData) return interaction.reply({ content: 'Lỗi Region. Bạn đang ở hư vô.', flags: require('discord.js').MessageFlags.Ephemeral });

        // Exploration Animation
        let buffText = '';
        if (regionData.buff) {
            buffText = `\n🌟 **Vùng Đất Ban Phước:** ${regionData.buff.desc}`;
        }

        const globalEventState = await db.queryOne("SELECT value FROM world_states WHERE key = 'global_event'");
        const globalEvent = globalEventState ? globalEventState.value : 'none';
        
        let eventText = '';
        if (globalEvent === 'blood_moon') eventText = `\n🔴 **HUYẾT NGUYỆT:** Quái vật đang rất hung hãn!`;
        else if (globalEvent === 'gold_rush') eventText = `\n⚜️ **CƠN SỐT VÀNG:** Nhận gấp đôi Vàng toàn cầu!`;
        else if (globalEvent === 'enlightenment') eventText = `\n🌠 **KHAI SÁNG:** Nhận gấp rưỡi Kinh nghiệm (EXP)!`;
        else if (globalEvent === 'divine_blessing') eventText = `\n🕊️ **PHƯỚC LÀNH:** Quái yếu đi, tỉ lệ rớt đồ tăng!`;

        const explorationEmbed = new EmbedBuilder()
            .setTitle('🗺️ Đang Thám Hiểm...')
            .setDescription(`Bạn đang cẩn thận rảo bước trong **${regionData.name}**...${buffText}${eventText}`)
            .setColor('#3498db')
            .setImage(gifData.explore);

        const msg = await interaction.reply({ embeds: [explorationEmbed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(3000); // GIF duration

        // Random Roll: 70% Monster, 30% Event
        const roll = Math.random();

        if (roll < 0.7) {
            // MONSTER ENCOUNTER with Rarity weights
            const monsters = regionData.monsters;
            const rarityRoll = Math.random();
            let selectedRarity = 'Common';
            
            if (rarityRoll < 0.05) selectedRarity = 'Elite';
            else if (rarityRoll < 0.30) selectedRarity = 'Rare';
            else selectedRarity = 'Common';

            // Filter monsters by selected rarity, fallback to Common if none found
            let possibleMonsters = monsters.filter(m => m.rarity === selectedRarity);
            if (possibleMonsters.length === 0) possibleMonsters = monsters.filter(m => m.rarity === 'Common');
            
            const monster = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];
            
            // Shiny Roll (1%)
            const isShiny = Math.random() < 0.01;
            const monsterName = isShiny ? `✨ Shiny ${monster.name}` : monster.name;

            const rarityColors = { 'Common': '#E74C3C', 'Rare': '#9b59b6', 'Elite': '#f1c40f' };
            if (isShiny) rarityColors[monster.rarity] = '#f1c40f'; // Override to gold for shiny

            const rarityIcons = { 'Common': '🧟', 'Rare': '🛡️', 'Elite': '👑' };
            const elemEmoji = require('../../utils/combatLogic').elements[monster.element]?.emoji || '';

            const embed = new EmbedBuilder()
                .setTitle(`${rarityIcons[monster.rarity]} [Lv.${monster.level}] ${isShiny ? 'SHINY ' : ''}${monster.rarity} MONSTER!`)
                .setDescription(`Bạn đang thám hiểm **${regionData.name}** thì chạm mặt **${monsterName}** ${elemEmoji}!`)
                .setColor(isShiny ? '#f1c40f' : (rarityColors[monster.rarity] || '#E74C3C'))
                .addFields(
                    { name: 'Kẻ thù', value: `❤️ HP: ${isShiny ? Math.floor(monster.hp * 1.2) : monster.hp} | 🗡️ ATK: ${isShiny ? Math.floor(monster.atk * 1.2) : monster.atk}`, inline: true },
                    { name: 'Của bạn', value: `❤️ HP: ${player.hp}/${player.max_hp}`, inline: true }
                );

            const files = [];
            if (monster.image) {
                if (monster.image.startsWith('http')) {
                    embed.setThumbnail(monster.image);
                    embed.setImage(monster.image);
                } else {
                    const regionId = player.current_region;
                    const imageBaseName = path.basename(monster.image);
                    const imagePath = path.join(__dirname, '../../assets/monsters', regionId, imageBaseName);
                    const attachment = new AttachmentBuilder(imagePath, { name: imageBaseName });
                    files.push(attachment);
                    embed.setThumbnail(`attachment://${imageBaseName}`);
                    embed.setImage(`attachment://${imageBaseName}`);
                }
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`battle_${monster.id}_${isShiny ? Math.floor(monster.hp * 1.2) : monster.hp}_${isShiny ? 1 : 0}`)
                        .setLabel('Tấn Công')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚔️'),
                    new ButtonBuilder()
                        .setCustomId('escape')
                        .setLabel('Bỏ Chạy')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🏃')
                );

            return msg.edit({ embeds: [embed], components: [row], files: files });
        } else {
            // EVENT ENCOUNTER
            const event = regionData.events[Math.floor(Math.random() * regionData.events.length)];
            const embed = new EmbedBuilder()
                .setTitle(`✨ Sự Kiện Ngẫu Nhiên`)
                .setDescription(event.text)
                .setColor('#F1C40F');

            if (event.heal) {
                const newHp = Math.min(player.hp + event.heal, player.max_hp);
                await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [newHp, userId]);
                embed.addFields({ name: 'Chữa lành', value: `Lấy lại ${event.heal} HP. (Hiện tại: ${newHp}/${player.max_hp})` });
            } else if (event.gold) {
                let eventGold = event.gold;
                if (globalEvent === 'gold_rush') eventGold *= 2;
                await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [eventGold, userId]);
                require('../../utils/questLogic').addProgress(userId, 'earn_gold', eventGold);
                embed.addFields({ name: 'Phần Thưởng', value: `Nhận được 🪙 ${eventGold} Vàng.` });
            } else if (event.damage) {
                const newHp = Math.max(0, player.hp - event.damage);
                await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [newHp, userId]);
                embed.addFields({ name: 'Thiệt Hại', value: `Bị trừ ${event.damage} HP. (Hiện tại: ${newHp}/${player.max_hp})` });
                if (newHp === 0) embed.setFooter({ text: '💀 Bạn đã chết tại sự kiện này!' });
            } else if (event.exp) {
                let eventExp = event.exp;
                if (globalEvent === 'enlightenment') eventExp = Math.floor(eventExp * 1.5);
                await require('../../utils/rpgLogic').addExp(userId, eventExp);
                embed.addFields({ name: 'Kinh Nghiệm', value: `Nhận được ✨ ${eventExp} Exp.` });
            }

            return msg.edit({ embeds: [embed] });
        }
    },
};

