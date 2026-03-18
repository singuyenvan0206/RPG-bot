const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
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

async function handleButton(interaction) {
    const { customId, user } = interaction;
    const userId = user.id;
    const { MessageFlags } = require('discord.js');

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

    if (customId.startsWith('battle_')) {
        let monsterId = '';
        let mHpStr = '';
        const match = customId.match(/^battle_(.+)_(\d+)$/);
        if (match) {
            monsterId = match[1];
            mHpStr = match[2];
        } else {
            monsterId = customId.replace('battle_', '');
        }
        
        const player = await db.getPlayer(userId);
        if (!player || player.hp <= 0) return interaction.reply({ content: 'Bạn không thể chiến đấu lúc này!', flags: MessageFlags.Ephemeral });
        
        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);

        // Find monster in current region
        const region = rpgData[player.current_region];
        const monster = region.monsters.find(m => m.id === monsterId);
        
        if (!monster) return interaction.reply({ content: 'Quái vật đã biến mất!', flags: MessageFlags.Ephemeral });

        // Simple turn calculation
        let log = '';
        let mHp = mHpStr ? parseInt(mHpStr, 10) : monster.hp;
        let pHp = player.hp;

        // Elemental & Skills
        const learnedSkills = await db.getPlayerSkills(userId);
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const weaponId = equip?.weapon_id;
        const weapon = weaponId ? itemsData.getItem(weaponId) : null;
        const pElement = weapon?.element || null;
        const mElement = monster.element || null;

        let pElemMult = combatLogic.getElementalMultiplier(pElement, mElement);
        let mElemMult = combatLogic.getElementalMultiplier(mElement, pElement);

        // Player Skill (pass player for heal/drain effects)
        const pSkill = combatLogic.triggerCombatSkills(learnedSkills, player.class, player);
        
        // Player attacks first
        let pBaseDmg = stats.attack;
        let isCrit = Math.random() < stats.crit_rate;
        let pDmg = isCrit ? Math.floor(pBaseDmg * stats.crit_damage) : pBaseDmg;
        
        // Determine element: if skill was triggered and has element, use skill's element; otherwise use weapon's
        const effectiveAttackElement = (pSkill && pSkill.effect === 'attack' && pSkill.element) ? pSkill.element : pElement;
        pElemMult = combatLogic.getElementalMultiplier(effectiveAttackElement, mElement);
        
        // Apply Elemental & Skill
        pDmg = Math.floor(pDmg * pElemMult);

        if (pSkill) {
            if (pSkill.effect === 'attack') {
                pDmg = Math.floor(pDmg * pSkill.multiplier);
                log += `✨ **${pSkill.name}**: ${pSkill.msg}\n`;
            } else if (pSkill.effect === 'heal') {
                const healAmt = Math.floor(player.max_hp * pSkill.heal_pct);
                pHp = Math.min(player.max_hp, pHp + healAmt);
                log += `💚 **${pSkill.name}**: ${pSkill.msg} Hồi **${healAmt} HP**!\n`;
            } else if (pSkill.effect === 'drain') {
                pDmg = Math.floor(pDmg * (pSkill.multiplier || 1.0));
                const drainAmt = Math.floor(player.max_hp * pSkill.heal_pct);
                pHp = Math.min(player.max_hp, pHp + drainAmt);
                log += `🩸 **${pSkill.name}**: ${pSkill.msg} Gây **${pDmg}** sát thương và hồi **${drainAmt} HP**!\n`;
            } else if (pSkill.effect === 'dot') {
                // Apply base attack + dot damage
                const dotDmg = pSkill.dot_dmg || 0;
                mHp -= dotDmg;
                log += `🐍 **${pSkill.name}**: ${pSkill.msg} Gây thêm **${dotDmg}** độc!\n`;
            }
        }

        if (isCrit) log += `💥 **BẠO KÍCH!** Bạn tung đòn hiểm hóc lên ${monster.name}.\n`;
        if (pElemMult > 1) log += `🔥 **Ưu thế hệ!** Đòn đánh cực kỳ hiệu quả.\n`;
        else if (pElemMult < 1) log += `💧 **Bị khắc hệ!** Sát thương bị giảm sút.\n`;

        if (pSkill?.effect !== 'heal') {
            log += `⚔️ Bạn gây **${pDmg}** sát thương.\n`;
            mHp -= pDmg;
        }

        if (mHp <= 0) {
            log += `\n🎉 **Chiến thắng!**\nBạn nhận được 🪙 **${monster.gold} Vàng** và 🌟 **${monster.exp} EXP**.`;
            
            // Level up logic
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [monster.gold, userId]);
            require('../utils/questLogic').addProgress(userId, 'kill_monster', 1);
            require('../utils/questLogic').addProgress(userId, 'earn_gold', monster.gold);

            const expResult = await require('../utils/rpgLogic').addExp(userId, monster.exp);
            
            if (expResult && expResult.leveledUp) {
                log += `\n🆙 **Lên Cấp!** Bạn đã đạt cấp độ ${expResult.newLevel}. Sinh lực được hồi phục!`;
            }

            // Item Drop Logic
            if (Math.random() < 0.25) { // 25% drop rate for gear
                const itemsList = Object.keys(require('../utils/itemsData').getAllItems());
                const droppedItem = itemsList[Math.floor(Math.random() * itemsList.length)];
                await db.execute(
                    'INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', 
                    [userId, droppedItem]
                );
                const itemInfo = require('../utils/itemsData').getItem(droppedItem);
                log += `\n🎁 **Rơi Đồ!** Bạn nhặt được 1x **${itemInfo.name}** [${itemInfo.rarity}].`;
            }

            // Material Drop Logic
            if (Math.random() < 0.45) { // Increased drop rate slightly
                const matRoll = Math.random();
                let rolledMat = 'iron_ore';
                
                // Logic based on rarity/roll
                if (matRoll < 0.01) rolledMat = 'dragon_scale';  // 1% Legendary
                else if (matRoll < 0.05) rolledMat = 'diamond';   // 4% Epic
                else if (matRoll < 0.12) rolledMat = 'void_shard'; // 7% Epic
                else if (matRoll < 0.25) rolledMat = 'magic_core'; // 13% Rare
                else {
                    // Common drops based on region/monster
                    const commons = ['iron_ore', 'slime_essence', 'goblin_tooth', 'wolf_pelt', 'medicinal_herb'];
                    rolledMat = commons[Math.floor(Math.random() * commons.length)];
                }

                await db.execute(
                    'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, 1) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', 
                    [userId, rolledMat]
                );
                const matInfo = require('../utils/materialsData').getMaterial(rolledMat);
                log += `\n🛠️ **Nguyên Liệu Rớt:** 1x **${matInfo.name}**.`;
            }

            // World Boss Spawning System
            const regionId = player.current_region;
            const bossData = require('../utils/bossData')[regionId];
            
            if (bossData) {
                // Check if boss is already alive
                const bossHpState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${regionId}_boss_hp`]);
                
                if (!bossHpState || parseInt(bossHpState.value) <= 0) {
                    // Boss is dead, increment kills
                    let kills = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${regionId}_kills`]);
                    let currentKills = kills ? parseInt(kills.value) : 0;
                    currentKills += 1;
                    
                    if (currentKills >= bossData.spawn_req) {
                        // SPAWN BOSS
                        await db.execute(
                            'INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                            [`${regionId}_boss_hp`, bossData.max_hp.toString()]
                        );
                        await db.execute(
                            'INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                            [`${regionId}_kills`, '0']
                        );
                        log += `\n\n🚨 **CẢNH BÁO TOÀN CẦU!**\nMáu đã đổ quá nhiều. **${bossData.name}** đã thức tỉnh tại ${region.name}! Dùng lệnh \`/boss\` để tiêu diệt nó!`;
                    } else {
                        await db.execute(
                            'INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                            [`${regionId}_kills`, currentKills.toString()]
                        );
                        // log += `\n(Tiến trình boss: ${currentKills}/${bossData.spawn_req})`;
                    }
                }
            }

            const winEmbed = new EmbedBuilder().setColor('#2ecc71').setDescription(log);
            const winFiles = [];
            if (monster.image) {
                if (monster.image.startsWith('http')) {
                    winEmbed.setThumbnail(monster.image);
                } else {
                    const regionId = player.current_region;
                    const imageBaseName = path.basename(monster.image);
                    const imagePath = path.join(__dirname, '../assets/monsters', regionId, imageBaseName);
                    winFiles.push(new AttachmentBuilder(imagePath, { name: imageBaseName }));
                    winEmbed.setThumbnail(`attachment://${imageBaseName}`);
                }
            }
            return interaction.update({ embeds: [winEmbed], components: [], files: winFiles });
        }

        // Monster hits back
        let mBaseDmg = monster.atk;
        let mDmg = Math.max(1, mBaseDmg - Math.floor(stats.defense / 2));
        mDmg = Math.floor(mDmg * mElemMult);

        // Shield Block passive: 15% chance to block 50% of incoming damage
        const shieldBlockData = learnedSkills && Array.isArray(learnedSkills)
            ? learnedSkills.find(ls => ls.skill_id === 'shield_block' && ls.equipped_slot)
            : null;
        if (shieldBlockData && Math.random() < 0.15) {
            mDmg = Math.floor(mDmg * 0.5);
            log += `🛡️ **Shield Block** kích hoạt! Chặn được 50% sát thương!\n`;
        }

        log += `💢 ${monster.name} ${mElemMult > 1 ? '(Ưu thế hệ!) ' : ''}tấn công gây **${mDmg}** sát thương.\n`;

        if (pSkill && pSkill.effect === 'reflect') {
            const reflected = Math.floor(mDmg * pSkill.multiplier);
            mHp -= reflected;
            log += `🌵 **${pSkill.name}**: ${pSkill.msg} Phản lại **${reflected}** sát thương!\n`;
        }
        
        pHp -= mDmg;

        if (pHp <= 0) {
            pHp = 0;
            const RESPAWN_MS = 5 * 60 * 1000; // 5 phút
            const deadUntil = Date.now() + RESPAWN_MS;
            log += `\n💀 **Tử Dận!** Bạn gục ngã trước ${monster.name}. Hồi sinh sau **5 phút**.`;
            await db.execute('UPDATE players SET hp = 0, dead_until = $1 WHERE user_id = $2', [deadUntil, userId]);
            const loseEmbed = new EmbedBuilder().setColor('#000000').setDescription(log);
            const loseFiles = [];
            if (monster.image) {
                if (monster.image.startsWith('http')) {
                    loseEmbed.setThumbnail(monster.image);
                } else {
                    const regionId = player.current_region;
                    const imageBaseName = path.basename(monster.image);
                    const imagePath = path.join(__dirname, '../assets/monsters', regionId, imageBaseName);
                    loseFiles.push(new AttachmentBuilder(imagePath, { name: imageBaseName }));
                    loseEmbed.setThumbnail(`attachment://${imageBaseName}`);
                }
            }
            return interaction.update({ embeds: [loseEmbed], components: [], files: loseFiles });
        }

        // Update HP for next turn
        await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [pHp, userId]);

        const nextTurnEmbed = new EmbedBuilder()
            .setTitle(`⚔️ Trận chiến đang diễn ra!`)
            .setDescription(log)
            .setColor('#E67E22')
            .addFields(
                { name: `👾 ${monster.name}`, value: createHealthBar(mHp, monster.hp), inline: false },
                { name: '🛡️ Trạng thái của bạn', value: createHealthBar(pHp, player.max_hp), inline: false }
            );
        
        const files = [];
        if (monster.image) {
            if (monster.image.startsWith('http')) {
                nextTurnEmbed.setThumbnail(monster.image);
            } else {
                const regionId = player.current_region;
                const imageBaseName = path.basename(monster.image);
                const imagePath = path.join(__dirname, '../assets/monsters', regionId, imageBaseName);
                const attachment = new AttachmentBuilder(imagePath, { name: imageBaseName });
                files.push(attachment);
                nextTurnEmbed.setThumbnail(`attachment://${imageBaseName}`);
            }
        }

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`battle_${monster.id}_${mHp}`)
                    .setLabel('Tấn Công')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('escape')
                    .setLabel('Bỏ Chạy')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏃')
            );

        interaction.update({ embeds: [nextTurnEmbed], components: [row], files: files });
    }
}


