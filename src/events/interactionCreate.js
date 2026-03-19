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

    if (customId.startsWith('battle_') || customId.startsWith('use_hp_') || customId.startsWith('use_mana_')) {
        let action = 'attack';
        let prefix = 'battle_';
        
        if (customId.startsWith('use_hp_')) {
            action = 'heal';
            prefix = 'use_hp_';
        } else if (customId.startsWith('use_mana_')) {
            action = 'mana';
            prefix = 'use_mana_';
        }

        let monsterId = '';
        let mHpStr = '';
        let isShiny = 0;
        
        let remainder = customId.substring(prefix.length);
        let match = remainder.match(/^(.+?)_(\d+)(?:_(\d+))?$/);

        if (match) {
            monsterId = match[1];
            mHpStr = match[2];
            if (match[3]) isShiny = parseInt(match[3], 10);
        } else {
            // Cứu cánh cuối cùng nếu regex vẫn tạch
            const parts = remainder.split('_');
            if (parts.length >= 2) {
                isShiny = parseInt(parts.pop(), 10) || 0;
                mHpStr = parts.pop();
                monsterId = parts.join('_');
            }
        }
        
        const player = await db.getPlayer(userId);
        if (!player || player.hp <= 0) return interaction.reply({ content: 'Bạn không thể chiến đấu lúc này!', flags: MessageFlags.Ephemeral });
        
        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);

        // Find monster in current region
        const region = rpgData[player.current_region];
        const monster = region.monsters.find(m => m.id === monsterId);
        
        if (!monster) return interaction.reply({ content: 'Quái vật đã biến mất!', flags: MessageFlags.Ephemeral });

        let mMaxHp = isShiny ? Math.floor(monster.hp * 1.2) : monster.hp;
        let mAtk = isShiny ? Math.floor(monster.atk * 1.2) : monster.atk;
        let mGold = isShiny ? monster.gold * 5 : monster.gold;
        let mExp = isShiny ? monster.exp * 5 : monster.exp;
        let mName = isShiny ? `✨ Shiny ${monster.name}` : monster.name;

        // Apply Global Events
        const globalEventState = await db.queryOne("SELECT value FROM world_states WHERE key = 'global_event'");
        const globalEvent = globalEventState ? globalEventState.value : 'none';

        if (globalEvent === 'blood_moon') {
            mMaxHp = Math.floor(mMaxHp * 1.2);
            mAtk = Math.floor(mAtk * 1.2);
            mGold = Math.floor(mGold * 1.5);
            mName = `🔴 [Huyết Nguyệt] ` + mName;
        } else if (globalEvent === 'gold_rush') {
            mGold = Math.floor(mGold * 2.0);
        } else if (globalEvent === 'enlightenment') {
            mExp = Math.floor(mExp * 1.5);
        } else if (globalEvent === 'divine_blessing') {
            mMaxHp = Math.floor(mMaxHp * 0.9);
            mAtk = Math.floor(mAtk * 0.9);
            mName = `🕊️ [Kẻ Yếu] ` + mName;
        }

        // Simple turn calculation
        let log = '';
        let mHp = mHpStr ? parseInt(mHpStr, 10) : mMaxHp;
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
        
        let regionBuff = region.buff || {};

        // Territory Buff check
        if (player.guild_id && Object.keys(regionBuff).length > 0) {
            const territoryState = await db.queryOne("SELECT value FROM world_states WHERE key = $1", [`territory_${player.current_region}`]);
            if (territoryState && territoryState.value === player.guild_id) {
                // X2 Lợi ích cho bang làm chủ
                regionBuff = { ...regionBuff }; // Clone
                for (const k in regionBuff) {
                    if (typeof regionBuff[k] === 'number') {
                        regionBuff[k] *= 2;
                    }
                }
            }
        }
        
        let pBaseDmg = regionBuff.atk_bonus ? Math.floor(stats.attack * (1 + regionBuff.atk_bonus)) : stats.attack;
        let pDef = regionBuff.def_bonus ? Math.floor(stats.defense * (1 + regionBuff.def_bonus)) : stats.defense;
        let pMaxHp = regionBuff.hp_bonus ? Math.floor(player.max_hp * (1 + regionBuff.hp_bonus)) : player.max_hp;
        let pCritRate = regionBuff.crit_bonus ? stats.crit_rate + regionBuff.crit_bonus : stats.crit_rate;

        if (action === 'attack') {
            // Player attacks first
            let isCrit = Math.random() < pCritRate;
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
                    const healAmt = Math.floor(pMaxHp * pSkill.heal_pct);
                    pHp = Math.min(pMaxHp, pHp + healAmt);
                    log += `💚 **${pSkill.name}**: ${pSkill.msg} Hồi **${healAmt} HP**!\n`;
                } else if (pSkill.effect === 'drain') {
                    pDmg = Math.floor(pDmg * (pSkill.multiplier || 1.0));
                    const drainAmt = Math.floor(pMaxHp * pSkill.heal_pct);
                    pHp = Math.min(pMaxHp, pHp + drainAmt);
                    log += `🩸 **${pSkill.name}**: ${pSkill.msg} Gây **${pDmg}** sát thương và hồi **${drainAmt} HP**!\n`;
                } else if (pSkill.effect === 'dot') {
                    // Apply base attack + dot damage
                    const dotDmg = pSkill.dot_dmg || 0;
                    mHp -= dotDmg;
                    log += `🐍 **${pSkill.name}**: ${pSkill.msg} Gây thêm **${dotDmg}** độc!\n`;
                }
            }

            if (isCrit) log += `💥 **BẠO KÍCH!** Bạn tung đòn hiểm hóc lên ${mName}.\n`;
            if (pElemMult > 1) log += `🔥 **Ưu thế hệ!** Đòn đánh cực kỳ hiệu quả.\n`;
            else if (pElemMult < 1) log += `💧 **Bị khắc hệ!** Sát thương bị giảm sút.\n`;

            if (pSkill?.effect !== 'heal') {
                log += `⚔️ Bạn gây **${pDmg}** sát thương.\n`;
                mHp -= pDmg;
            }
        } else {
            // Player uses item
            const itemToUse = action === 'heal' ? 'healing_potion' : 'mana_potion';
            const logName = action === 'heal' ? 'Thuốc Hồi Máu' : 'Thuốc Hồi Mana';
            const inv = await db.queryOne('SELECT amount FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, itemToUse]);
            
            if (!inv || inv.amount <= 0) {
                return interaction.reply({ content: `❌ Bạn không còn ${logName} trong túi đồ! Gõ \`$mua ${itemToUse}\` để sắm thêm.`, flags: MessageFlags.Ephemeral });
            }

            if (action === 'heal') {
                if (pHp >= pMaxHp) return interaction.reply({ content: `❌ Máu của bạn đã đầy rồi!`, flags: MessageFlags.Ephemeral });
                pHp = Math.min(pMaxHp, pHp + 100);
                log += `💚 Bạn đã sử dụng **Thuốc Hồi Máu**, phục hồi 100 HP!\n`;
            } else if (action === 'mana') {
                let pMana = player.mana;
                let pMaxMana = player.max_mana;
                if (pMana >= pMaxMana) return interaction.reply({ content: `❌ Mana của bạn đã đầy rồi!`, flags: MessageFlags.Ephemeral });
                pMana = Math.min(pMaxMana, pMana + 50);
                await db.execute('UPDATE players SET mana = $1 WHERE user_id = $2', [pMana, userId]);
                log += `✨ Bạn đã sử dụng **Thuốc Hồi Mana**, phục hồi 50 Mana!\n`;
            }

            if (inv.amount === 1) {
                await db.execute('DELETE FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, itemToUse]);
            } else {
                await db.execute('UPDATE inventory SET amount = amount - 1 WHERE user_id = $1 AND item_id = $2', [userId, itemToUse]);
            }
        }

        if (mHp <= 0) {
            if (regionBuff.gold_bonus) mGold = Math.floor(mGold * (1 + regionBuff.gold_bonus));
            if (regionBuff.exp_bonus) mExp = Math.floor(mExp * (1 + regionBuff.exp_bonus));
            
            log += `\n🎉 **Chiến thắng!**\nBạn nhận được 🪙 **${mGold} Vàng** và 🌟 **${mExp} EXP**.`;
            
            // Level up logic
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [mGold, userId]);
            require('../utils/questLogic').addProgress(userId, 'kill_monster', 1);
            require('../utils/questLogic').addProgress(userId, 'earn_gold', mGold);

            const expResult = await require('../utils/rpgLogic').addExp(userId, mExp);
            
            if (expResult && expResult.leveledUp) {
                log += `\n🆙 **LÊN CẤP!** Bạn đã đạt cấp độ ${expResult.newLevel}!`;
                log += `\n❤️ Máu và Mana đã được hồi phục đầy. Chỉ số cơ bản được tăng cường.`;
            }

            // Guild contribution
            if (player.guild_id) {
                const guildExpResult = await require('../utils/rpgLogic').addGuildExp(player.guild_id, 5);
                if (guildExpResult && guildExpResult.leveledUp) {
                    log += `\n🏰 **Hỉ Sự!** Bang Hội của bạn đã thăng lên **Cấp ${guildExpResult.newLevel}**!`;
                }
            }
            // Item Drop Logic
            let dropRateGear = 0.25 + (regionBuff.drop_bonus || 0);
            if (globalEvent === 'divine_blessing') dropRateGear += 0.15;
            if (Math.random() < dropRateGear) { // Default 25% drop rate for gear
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
            let dropRateMat = 0.45 + (regionBuff.drop_bonus || 0);
            if (globalEvent === 'divine_blessing') dropRateMat += 0.15;
            if (Math.random() < dropRateMat) { // Increased drop rate slightly
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
        let mBaseDmg = regionBuff.monster_atk_bonus ? Math.floor(mAtk * (1 + regionBuff.monster_atk_bonus)) : mAtk;
        let mDmg = Math.max(1, mBaseDmg - Math.floor(pDef / 2));
        mDmg = Math.floor(mDmg * mElemMult);

        // Shield Block passive: 15% chance to block 50% of incoming damage
        const shieldBlockData = learnedSkills && Array.isArray(learnedSkills)
            ? learnedSkills.find(ls => ls.skill_id === 'shield_block' && ls.equipped_slot)
            : null;
        if (shieldBlockData && Math.random() < 0.15) {
            mDmg = Math.floor(mDmg * 0.5);
            log += `🛡️ **Shield Block** kích hoạt! Chặn được 50% sát thương!\n`;
        }

        log += `💢 ${mName} ${mElemMult > 1 ? '(Ưu thế hệ!) ' : ''}tấn công gây **${mDmg}** sát thương.\n`;

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
            log += `\n💀 **Tử Dận!** Bạn gục ngã trước ${mName}. Hồi sinh sau **5 phút**.`;
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
                { name: `👾 ${mName}`, value: createHealthBar(mHp, mMaxHp), inline: false },
                { name: '🛡️ Trạng thái của bạn', value: createHealthBar(pHp, pMaxHp), inline: false }
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
                    .setCustomId(`battle_${monster.id}_${mHp}_${isShiny}`)
                    .setLabel('Tấn Công')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId(`use_hp_${monster.id}_${mHp}_${isShiny}`)
                    .setLabel('Bơm Máu')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🧪'),
                new ButtonBuilder()
                    .setCustomId(`use_mana_${monster.id}_${mHp}_${isShiny}`)
                    .setLabel('Bơm Mana')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎐'),
                new ButtonBuilder()
                    .setCustomId('escape')
                    .setLabel('Bỏ Chạy')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏃')
            );

        interaction.update({ embeds: [nextTurnEmbed], components: [row], files: files });
    }
}


