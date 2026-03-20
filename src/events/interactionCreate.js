const { Events, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isButton()) {
            return handleButton(interaction);
        }

        // Context Menu Commands (User / Message)
        if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const { MessageFlags } = require('discord.js');
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Có lỗi xảy ra!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'Có lỗi xảy ra!', flags: MessageFlags.Ephemeral });
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const { MessageFlags } = require('discord.js');
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Có lỗi xảy ra khi thực hiện lệnh này!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'Có lỗi xảy ra khi thực hiện lệnh này!', flags: MessageFlags.Ephemeral });
            }
        }
    },
};

const db = require('../database');
const rpgData = require('../utils/rpgData');
const { createHealthBar } = require('../utils/uiHelper');
const combatLogic = require('../utils/combatLogic');
const itemsData = require('../utils/itemsData');
const sessionManager = require('../utils/sessionManager');
const rpgLogic = require('../utils/rpgLogic');
const questLogic = require('../utils/questLogic');
const { sendGlobal } = require('../utils/broadcast');
const CombatService = require('../services/CombatService');
const UserLock = require('../utils/UserLock');

async function handleButton(interaction) {
    const { customId, user } = interaction;
    const userId = user.id;
    const { MessageFlags } = require('discord.js');

    if (!UserLock.acquire(userId)) {
        return interaction.reply({ content: '⏳ Thao tác quá nhanh! Vui lòng đợi hành động trước đó kết thúc.', flags: MessageFlags.Ephemeral });
    }

    try {
        if (customId === 'session_finish') {
        const session = sessionManager.getSession(userId);
        if (!session) return interaction.reply({ content: 'Không có hành trình nào đang diễn ra.', flags: MessageFlags.Ephemeral });

        const rewards = session.accumulatedRewards;
        await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [rewards.gold, userId]);
        await rpgLogic.addExp(userId, rewards.exp);
        
        // Add items to inventory
        for (const itemId of rewards.items) {
            await db.execute('INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [userId, itemId]);
        }

        sessionManager.endSession(userId);
        return interaction.update({
            content: `🏃 Bạn đã kết thúc hành trình an toàn.\n💰 **Tổng Vàng:** ${rewards.gold}\n🌟 **Tổng EXP:** ${rewards.exp}\n🎁 **Vật phẩm:** ${rewards.items.length > 0 ? rewards.items.length : 'Không có'}`,
            embeds: [], components: []
        });
    }

    if (customId === 'session_continue') {
        const session = sessionManager.getSession(userId);
        if (!session) return interaction.reply({ content: 'Không có hành trình nào đang diễn ra.', flags: MessageFlags.Ephemeral });

        const regionData = rpgData[session.region];
        session.progress++;
        
        // --- QUEST PROGRESS ---
        await questLogic.addProgress(userId, 'explore', 1);

        const roll = Math.random();
        if (roll < 0.7) {
            // MONSTER ENCOUNTER
            const monsters = regionData.monsters;
            const rarityRoll = Math.random();
            let rarity = 'Common';
            if (rarityRoll < 0.05) rarity = 'Elite';
            else if (rarityRoll < 0.25) rarity = 'Rare';
            
            let possible = monsters.filter(m => m.rarity === rarity);
            if (possible.length === 0) possible = monsters.filter(m => m.rarity === 'Common');
            const monster = possible[Math.floor(Math.random() * possible.length)];
            
            const isShiny = Math.random() < 0.01;
            const mHp = isShiny ? Math.floor(monster.hp * 1.5) : monster.hp;
            
            session.monster = {
                id: monster.id,
                hp: mHp,
                maxHp: mHp,
                isShiny: isShiny,
                statusEffects: []
            };

            // Prepare Embed
            const mName = isShiny ? `✨ Shiny ${monster.name}` : monster.name;
            const embed = new EmbedBuilder()
                .setTitle(`⚔️ Tầng ${session.progress}: Gặp ${mName}!`)
                .setDescription(`Một con quái vật chặn đường bạn!`)
                .setColor(isShiny ? '#f1c40f' : '#e74c3c')
                .addFields(
                    { name: 'Kẻ thù', value: `❤️ HP: ${mHp} | 🗡️ ATK: ${isShiny ? Math.floor(monster.atk * 1.5) : monster.atk}`, inline: true },
                    { name: 'Của bạn', value: `❤️ HP: ${session.hp}/${session.maxHp}`, inline: true }
                );

            const imgPath = path.join(process.cwd(), 'src', 'assets', 'monsters', session.region, monster.image || 'placeholder.png');
            let files = [];
            const fs = require('fs');
            if (fs.existsSync(imgPath)) {
                files.push(new AttachmentBuilder(imgPath, { name: 'monster.png' }));
                embed.setImage('attachment://monster.png');
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`battle_${monster.id}_${mHp}_${isShiny ? 1 : 0}`).setLabel('Tấn Công').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
                    new ButtonBuilder().setCustomId(`use_hp_${monster.id}_${mHp}_${isShiny ? 1 : 0}`).setLabel('Bơm Máu').setStyle(ButtonStyle.Success).setEmoji('🧪'),
                    new ButtonBuilder().setCustomId('session_finish').setLabel('Bỏ Chạy').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
                );

            return interaction.update({ embeds: [embed], components: [row], files: files });
        } else {
            // EVENT
            const event = regionData.events[Math.floor(Math.random() * regionData.events.length)];
            const embed = new EmbedBuilder().setTitle('✨ Sự Kiện Ngẫu Nhiên').setDescription(event.text).setColor('#f1c40f');

            if (event.gold) {
                session.accumulatedRewards.gold += event.gold;
                embed.addFields({ name: 'Phần Thưởng', value: `+ 🪙 ${event.gold} Vàng` });
            }
            if (event.exp) {
                session.accumulatedRewards.exp += event.exp;
                embed.addFields({ name: 'Kinh Nghiệm', value: `+ ✨ ${event.exp} Exp` });
            }
            if (event.damage) {
                session.hp = Math.max(0, Math.floor(session.hp - event.damage));
                embed.addFields({ name: 'Thiệt Hại', value: `- ${event.damage} HP` });
                await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [session.hp, userId]);
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣'),
                new ButtonBuilder().setCustomId('session_finish').setLabel('Rút Lui').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );

            if (session.hp <= 0) {
                sessionManager.endSession(userId);
                return interaction.update({ content: '💀 Bạn đã tử nạn trong cuộc thám hiểm!', embeds: [embed], components: [] });
            }

            return interaction.update({ embeds: [embed], components: [row] });
        }
    }

    if (customId === 'escape') {
        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: 'Lỗi Player', flags: MessageFlags.Ephemeral });

        // 50% chance to lose some gold when fleeing
        if (Math.random() < 0.5) {
            const lostGold = Math.floor(player.gold * 0.05); // lose 5%
            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [lostGold, userId]);
            await interaction.update({ content: `🏃 Bạn đã bỏ chạy thục mạng và đánh rơi **${lostGold} Vàng**.`, embeds: [], components: [] });
        } else {
            await interaction.update({ content: `🏃 Bạn đã tẩu thoát an toàn.`, embeds: [], components: [] });
        }
        return;
    }

    if (customId.startsWith('battle_') || customId.startsWith('use_hp_')) {
        const action = customId.startsWith('use_hp_') ? 'heal' : 'attack';
        const parts = customId.split('_');
        const isShiny = parseInt(parts.pop(), 10) === 1;
        const mHp = parseInt(parts.pop(), 10);
        const monsterId = parts.slice(1).join('_');
        return CombatService.handleBattle(interaction, userId, monsterId, mHp, isShiny, action);
    }

    if (customId.startsWith('boss_attack_')) {
        const regionId = customId.split('_')[2];
        return CombatService.handleBossBattle(interaction, userId, regionId);
    }

    if (customId.startsWith('trade_accept_')) {
        const tradeId = customId.split('_')[2];
        const trade = await db.queryOne('SELECT * FROM trades WHERE trade_id = $1', [tradeId]);
        
        if (!trade || trade.status !== 'pending') return interaction.reply({ content: 'Giao dịch không còn tồn tại hoặc đã xử lý!', flags: MessageFlags.Ephemeral });
        if (userId !== trade.receiver_id) return interaction.reply({ content: 'Bạn không phải là người nhận giao dịch này!', flags: MessageFlags.Ephemeral });

        const sender = await db.getPlayer(trade.sender_id);
        if (trade.gold > 0 && sender.gold < trade.gold) return interaction.reply({ content: 'Người gửi không còn đủ vàng!', flags: MessageFlags.Ephemeral });
        
        if (trade.item_id) {
            const inv = await db.queryOne('SELECT amount FROM inventory WHERE user_id = $1 AND item_id = $2', [trade.sender_id, trade.item_id]);
            if (!inv || inv.amount < trade.amount) return interaction.reply({ content: 'Người gửi không còn đủ vật phẩm!', flags: MessageFlags.Ephemeral });
        }

        try {
            await db.withTransaction(async (client) => {
                if (trade.gold > 0) {
                    await client.query('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [trade.gold, trade.sender_id]);
                    await client.query('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [trade.gold, trade.receiver_id]);
                }
                if (trade.item_id) {
                    await client.query('UPDATE inventory SET amount = amount - $1 WHERE user_id = $2 AND item_id = $3', [trade.amount, trade.sender_id, trade.item_id]);
                    await client.query('INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + EXCLUDED.amount', [trade.receiver_id, trade.item_id, trade.amount]);
                }
                await client.query('UPDATE trades SET status = \'accepted\' WHERE trade_id = $1', [tradeId]);
            });
            return interaction.update({ content: '✅ Giao dịch thành công!', embeds: [], components: [] });
        } catch (e) {
            console.error('[Trade Error]', e);
            return interaction.reply({ content: '❌ Lỗi hệ thống khi giao dịch or số dư thay đổi. Giao dịch thất bại.', flags: MessageFlags.Ephemeral });
        }
    }

    if (customId.startsWith('trade_decline_')) {
        const tradeId = customId.split('_')[2];
        await db.execute('UPDATE trades SET status = \'declined\' WHERE trade_id = $1', [tradeId]);
        return interaction.update({ content: '❌ Giao dịch đã bị từ chối.', embeds: [], components: [] });
    }
} finally {
    UserLock.release(userId);
}
}
