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

    if (customId === 'session_heal') {
        const session = sessionManager.getSession(userId);
        if (!session) return interaction.reply({ content: 'Không có hành trình nào đang diễn ra.', flags: MessageFlags.Ephemeral });

        const player = await rpgLogic.refreshMana(userId);
        if (player.mana < 2) {
            return interaction.reply({ content: '🔮 Bạn không đủ Mana để nghỉ ngơi! (Cần **2 Mana**)', flags: MessageFlags.Ephemeral });
        }

        if (session.hp >= session.maxHp) {
            return interaction.reply({ content: '❤️ Máu của bạn đã đầy!', flags: MessageFlags.Ephemeral });
        }

        const healAmount = Math.floor(session.maxHp * 0.25);
        session.hp = Math.min(session.maxHp, session.hp + healAmount);
        await db.execute('UPDATE players SET mana = mana - 2, hp = $1 WHERE user_id = $2', [session.hp, userId]);
        
        const regionInfo = rpgData[session.region] || { name: session.region };
        const embed = new EmbedBuilder()
            .setTitle(`⛺ Nghỉ Ngơi Tại ${regionInfo.name}`)
            .setDescription(`Bạn đã hồi phục **+${healAmount} HP** (Tiêu tốn 2 Mana).\n\n` +
                `❤️ **HP Hiện Tại:** ${session.hp}/${session.maxHp}\n` +
                `🔮 **Mana Còn Lại:** ${player.mana - 2}`)
            .setColor('#2ecc71');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣'),
                new ButtonBuilder().setCustomId('session_finish').setLabel('Rút Lui').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );

        return interaction.update({ embeds: [embed], components: [row] });
    }

    if (customId.startsWith('evtch_')) {
        const [, eventCodeStr, choiceId] = customId.split('_');
        const session = sessionManager.getSession(userId);
        if (!session) return interaction.reply({ content: 'Không có hành trình nào đang diễn ra.', flags: MessageFlags.Ephemeral });

        const regionKey = session.region;
        const regionData = rpgData[regionKey];
        const event = regionData.events.find(e => e.code === parseInt(eventCodeStr, 10));
        const choice = event?.choices?.find(c => c.id === choiceId);

        if (!choice) return interaction.reply({ content: 'Lựa chọn không hợp lệ.', flags: MessageFlags.Ephemeral });

        const effect = choice.effect;
        let log = effect.msg || '';
        let pStatusEffects = session.statusEffects || [];

        if (effect.hp) session.hp = Math.max(0, Math.min(session.maxHp, session.hp + effect.hp));
        if (effect.heal) session.hp = Math.min(session.maxHp, session.hp + effect.heal);
        if (effect.gold) session.accumulatedRewards.gold += effect.gold;
        if (effect.exp) session.accumulatedRewards.exp += effect.exp;
        if (effect.status) pStatusEffects.push({ type: effect.status, duration: 3 });

        session.statusEffects = pStatusEffects;
        sessionManager.updateSession(userId, session);

        const embed = new EmbedBuilder()
            .setTitle(`📜 Kết Quả: ${choice.label}`)
            .setDescription(log)
            .setColor(session.hp <= 0 ? '#000000' : '#2ecc71');

        if (session.hp <= 0) {
            sessionManager.endSession(userId);
            await db.execute('UPDATE players SET hp = 0, dead_until = $1, status_effects = \'[]\'::jsonb WHERE user_id = $2', [Date.now() + 300000, userId]);
            return interaction.update({ content: '💀 Lựa chọn của bạn đã dẫn đến cái chết!', embeds: [embed], components: [] });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣')
        );

        return interaction.update({ embeds: [embed], components: [row] });
    }

    if (customId === 'session_continue' || customId.startsWith('session_start_resume_')) {
        const session = sessionManager.getSession(userId);
        if (!session) return interaction.reply({ content: 'Không có hành trình nào đang diễn ra.', flags: MessageFlags.Ephemeral });

        if (customId.startsWith('session_start_resume_')) {
            const resumeFloor = parseInt(customId.split('_').pop(), 10);
            session.progress = resumeFloor;
        }

        const regionData = rpgData[session.region] || { name: session.region, monsters: [], events: [] };
        session.progress++;

        // --- PET EXPLORE BUFFS ---
        let petMsg = '';
        if (session.petId) {
            const petsData = require('../utils/petsData');
            const pet = petsData.getPet(session.petId);
            if (pet && pet.explore_buffs) {
                const eb = pet.explore_buffs;
                if (eb.heal_per_floor) {
                    const heal = Math.floor(session.maxHp * eb.heal_per_floor);
                    session.hp = Math.min(session.maxHp, session.hp + heal);
                    petMsg = `\n💖 **${pet.name}** đã hồi phục cho bạn **+${heal} HP**!`;
                }
                if (eb.gold_mult || eb.exp_mult || eb.reward_mult) {
                    petMsg += `\n✨ **${pet.name}** đang giúp bạn tìm thêm phần thưởng!`;
                }
            }
        }
        
        // --- FLOOR MODIFIER ROLL ---
        session.modifier = null;
        if (Math.random() < 0.15) {
            const modKeys = Object.keys(rpgData.EXPLORE_MODIFIERS);
            session.modifier = modKeys[Math.floor(Math.random() * modKeys.length)];
        }

        // --- QUEST PROGRESS ---
        await questLogic.addProgress(userId, 'explore', 1);

        const roll = Math.random();
        if (roll < 0.7) {
            // MONSTER ENCOUNTER
            // --- SEQUENTIAL MONSTER SELECTION ---
            const monsters = regionData.monsters;
            if (!monsters || monsters.length === 0) {
                return interaction.reply({ content: '❌ Không tìm thấy quái vật ở vùng đất này!', flags: MessageFlags.Ephemeral });
            }

            const monsterIndex = (session.progress - 1) % monsters.length;
            const difficultyIndex = Math.floor((session.progress - 1) / monsters.length) % 3; // 0: Thường, 1: Khó, 2: Ác Mộng
            
            const monster = monsters[monsterIndex];
            if (!monster) {
                return interaction.reply({ content: '❌ Lỗi dữ liệu quái vật!', flags: MessageFlags.Ephemeral });
            }

            const difficultyNames = ['Thường', 'Khó', 'Ác Mộng'];
            const diffName = difficultyNames[difficultyIndex];

            const isShiny = Math.random() < 0.01;
            const mHp = isShiny ? Math.floor(monster.hp * 1.5) : monster.hp;
            
            session.monster = {
                id: monster.id,
                hp: mHp,
                maxHp: mHp,
                isShiny: isShiny,
                difficulty: difficultyIndex,
                statusEffects: []
            };

            // Prepare Embed
            const mName = isShiny ? `✨ Shiny ${monster.name}` : monster.name;
            const embed = new EmbedBuilder()
                .setTitle(`⚔️ Tầng ${session.progress}: [${diffName}] ${mName}!`)
                .setDescription(`Một kẻ thù cản bước thám hiểm của bạn!${petMsg}`)
                .setColor(difficultyIndex === 2 ? '#e74c3c' : (difficultyIndex === 1 ? '#e67e22' : '#2ecc71'))
                .addFields(
                    { name: 'Kẻ thù', value: `❤️ HP: ${mHp} | 🗡️ ATK: ${isShiny ? Math.floor(monster.atk * 1.5) : monster.atk}`, inline: true },
                    { name: 'Của bạn', value: `❤️ HP: ${session.hp}/${session.maxHp}`, inline: true }
                );

            if (session.modifier) {
                const mod = rpgData.EXPLORE_MODIFIERS[session.modifier];
                embed.addFields({ name: '🌐 Môi trường', value: `**${mod.name}**: ${mod.desc}`, inline: false });
            }

            const imgPath = path.join(process.cwd(), 'src', 'assets', 'monsters', session.region, monster.image || 'placeholder.png');
            let files = [];
            const fs = require('fs');
            if (fs.existsSync(imgPath)) {
                files.push(new AttachmentBuilder(imgPath, { name: 'monster.png' }));
                embed.setImage('attachment://monster.png');
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`battle_${monster.id}_${mHp}_${isShiny ? 1 : 0}_${difficultyIndex}`).setLabel('Tấn Công').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
                    new ButtonBuilder().setCustomId(`use_hp_${monster.id}_${mHp}_${isShiny ? 1 : 0}_${difficultyIndex}`).setLabel('Bơm Máu').setStyle(ButtonStyle.Success).setEmoji('🧪'),
                    new ButtonBuilder().setCustomId('session_finish').setLabel('Bỏ Chạy').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
                );

            // Floor Milestone Feedback
            if (session.progress % 10 === 0) {
                embed.setFooter({ text: `🚩 TẦNG CỘT MỐC! Bạn đang đối đầu với kẻ thù mạnh mẽ.` });
                embed.setColor('#9b59b6'); // Purple for milestone
            }

            return interaction.update({ embeds: [embed], components: [row], files: files });
        } else {
            // EVENT OR MYSTERY CHEST
            const eventRoll = Math.random();
            if (eventRoll < 0.2) { // 20% of events are chests (6% total)
                const embed = new EmbedBuilder()
                    .setTitle(`🧰 Tầng ${session.progress}: Rương Kho Báu Bí Ẩn`)
                    .setDescription('Bạn tình cờ tìm thấy một chiếc rương cũ kỹ bám đầy rêu phong. Bạn sẽ làm gì?')
                    .setColor('#f1c40f');

                if (session.modifier) {
                    const mod = rpgData.EXPLORE_MODIFIERS[session.modifier];
                    embed.addFields({ name: '🌐 Môi trường', value: `**${mod.name}**: ${mod.desc}`, inline: false });
                }
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('chest_safe').setLabel('Mở Cẩn Thận').setStyle(ButtonStyle.Success).setEmoji('🧤'),
                    new ButtonBuilder().setCustomId('chest_risky').setLabel('Phá Khóa').setStyle(ButtonStyle.Danger).setEmoji('🔨'),
                    new ButtonBuilder().setCustomId('session_continue').setLabel('Bỏ Qua').setStyle(ButtonStyle.Secondary).setEmoji('👣')
                );

                return interaction.update({ embeds: [embed], components: [row] });
            } else {
                // REGULAR EVENT
                if (!regionData.events || regionData.events.length === 0) {
                     return interaction.reply({ content: '❌ Không tìm thấy sự kiện ở vùng đất này!', flags: MessageFlags.Ephemeral });
                }

                const event = regionData.events[Math.floor(Math.random() * regionData.events.length)];
                if (!event) {
                     return interaction.reply({ content: '❌ Lỗi dữ liệu sự kiện!', flags: MessageFlags.Ephemeral });
                }
                
                if (event.type === 'choice_event') {
                    const embed = new EmbedBuilder()
                        .setTitle(`📖 Tầng ${session.progress}: Sự Kiện Kỳ Lạ`)
                        .setDescription(event.text)
                        .setColor('#9b59b6');
                    
                    if (session.modifier) {
                        const mod = rpgData.EXPLORE_MODIFIERS[session.modifier];
                        embed.addFields({ name: '🌐 Môi trường', value: `**${mod.name}**: ${mod.desc}`, inline: false });
                    }

                    const row = new ActionRowBuilder().addComponents(
                        event.choices.map(c => 
                            new ButtonBuilder()
                                .setCustomId(`evtch_${event.code}_${c.id}`)
                                .setLabel(c.label)
                                .setStyle(ButtonStyle.Primary)
                        )
                    );
                    return interaction.update({ embeds: [embed], components: [row] });
                }

                // Simple Event Logic (Existing)
                let outcomeMsg = event.text;
                if (event.heal) session.hp = Math.min(session.maxHp, session.hp + event.heal);
                if (event.damage) session.hp = Math.max(0, session.hp - event.damage);
                if (event.gold) session.accumulatedRewards.gold += event.gold;
                if (event.exp) session.accumulatedRewards.exp += event.exp;

                const embed = new EmbedBuilder()
                    .setTitle(`📜 Tầng ${session.progress}: Sự Kiện`)
                    .setDescription(outcomeMsg + petMsg)
                    .setColor('#3498db');

                if (session.hp <= 0) {
                    sessionManager.endSession(userId);
                    await db.execute('UPDATE players SET hp = 0, dead_until = $1, status_effects = \'[]\'::jsonb WHERE user_id = $2', [Date.now() + 300000, userId]);
                    return interaction.update({ content: '💀 Bạn đã gục ngã vì sự kiện này!', embeds: [embed], components: [] });
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣')
                );
                return interaction.update({ embeds: [embed], components: [row] });
        }
    }
    }

    if (customId === 'chest_safe' || customId === 'chest_risky') {
        const session = sessionManager.getSession(userId);
        if (!session) return interaction.reply({ content: 'Không còn phiên thám hiểm.', flags: MessageFlags.Ephemeral });

        const isSafe = customId === 'chest_safe';
        const roll = Math.random();
        let resultMsg = '';
        let color = '#2ecc71';

        if (isSafe) {
            if (roll < 0.7) {
                const gold = Math.floor(Math.random() * 50) + 20;
                session.accumulatedRewards.gold += gold;
                resultMsg = `🧤 Bạn mở rương rất cẩn thận và tìm thấy **${gold} Vàng**!`;
            } else {
                resultMsg = '🧤 Rương trống rỗng, không có gì bên trong cả.';
                color = '#95a5a6';
            }
        } else { // Risky
            if (roll < 0.4) {
                const gold = Math.floor(Math.random() * 200) + 100;
                session.accumulatedRewards.gold += gold;
                resultMsg = `🔨 Bạn phá khóa và tìm thấy một túi vàng lớn: **${gold} Vàng**!`;
            } else if (roll < 0.7) {
                const damage = Math.floor(session.maxHp * 0.15);
                session.hp = Math.max(0, session.hp - damage);
                resultMsg = `💥 Bẫy kích hoạt! Bạn bị thương và mất **${damage} HP**.`;
                color = '#e74c3c';
                await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [session.hp, userId]);
            } else {
                resultMsg = '🔨 Khóa quá chắc chắn, bạn không thể mở được rương.';
                color = '#95a5a6';
            }
        }

        const embed = new EmbedBuilder().setTitle('🧰 Kết Quả Mở Rương').setDescription(resultMsg).setColor(color);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣'),
            new ButtonBuilder().setCustomId('session_finish').setLabel('Rút Lui').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
        );

        if (session.hp <= 0) {
            sessionManager.endSession(userId);
            return interaction.update({ content: '💀 Bạn đã gục ngã vì bẫy rương!', embeds: [embed], components: [] });
        }

        return interaction.update({ embeds: [embed], components: [row] });
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
        const difficulty = parseInt(parts.pop(), 10);
        const isShiny = parseInt(parts.pop(), 10) === 1;
        const mHp = parseInt(parts.pop(), 10);
        const monsterId = parts.slice(1).join('_');
        return CombatService.handleBattle(interaction, userId, monsterId, mHp, isShiny, action, difficulty);
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
