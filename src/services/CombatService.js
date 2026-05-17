const db = require('../database');
const combatLogic = require('../utils/combatLogic');
const rpgLogic = require('../utils/rpgLogic');
const questLogic = require('../utils/questLogic');
const sessionManager = require('../utils/sessionManager');
const itemsData = require('../utils/itemsData');
const { sendGlobal } = require('../utils/broadcast');
const { createHealthBar } = require('../utils/uiHelper');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

class CombatService {
    static async handleBattle(interaction, userId, monsterId, mHp, isShiny, action = 'attack', difficulty = 0) {
        const session = sessionManager.getSession(userId);
        const player = await db.getPlayer(userId);
        if (!player || (player.hp <= 0 && (!session || session.hp <= 0))) {
            return interaction.reply({ content: 'Bạn không thể chiến đấu!', flags: MessageFlags.Ephemeral });
        }

        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const weapon = equip?.weapon_id ? itemsData.getItem(equip.weapon_id) : null;
        const armor = equip?.armor_id ? itemsData.getItem(equip.armor_id) : null;
        const accessory = equip?.accessory_id ? itemsData.getItem(equip.accessory_id) : null;

        const playerPassives = [
            ...(weapon?.passives || []),
            ...(armor?.passives || []),
            ...(accessory?.passives || [])
        ];

        const rpgData = require('../utils/rpgData');
        const region = rpgData[player.current_region];
        if (!region) return interaction.reply({ content: '❌ Vùng đất không hợp lệ!', flags: MessageFlags.Ephemeral });
        
        const monster = region.monsters.find(m => m.id === monsterId);
        if (!monster) return interaction.reply({ content: 'Quái vật đã hết hạn!', flags: MessageFlags.Ephemeral });

        let mMaxHp = isShiny ? Math.floor(monster.hp * 1.5) : monster.hp;
        let mAtk = isShiny ? Math.floor(monster.atk * 1.5) : monster.atk;
        
        // --- DIFFICULTY SCALING ---
        const diffStatsMult = [1.0, 1.5, 2.5][difficulty] || 1.0;
        const diffRewardsMult = [1.0, 1.2, 1.5][difficulty] || 1.0;
        const difficultyNames = ['Thường', 'Khó', 'Ác Mộng'];
        
        mMaxHp = Math.floor(mMaxHp * diffStatsMult);
        mAtk = Math.floor(mAtk * diffStatsMult);
        
        let mName = (isShiny ? `✨ Shiny ${monster.name}` : monster.name);
        mName = `[${difficultyNames[difficulty]}] ${mName}`;
        
        let mStatusEffects = (session && session.monster) ? session.monster.statusEffects : [];

        // --- MONSTER SCALING ---
        const floor = session ? session.progress : 1;
        const scalingMod = 1 + (floor * 0.03); // 3% increase per floor
        mMaxHp = Math.floor(mMaxHp * scalingMod);
        mAtk = Math.floor(mAtk * scalingMod);

        // --- FETCH MAX FLOOR (for first-time rewards) ---
        const exploreData = await db.queryOne('SELECT max_floor FROM player_exploration WHERE user_id = $1 AND region_id = $2', [userId, player.current_region]);
        const maxCleared = exploreData ? exploreData.max_floor : 0;
        const isFirstClear = session && session.progress > maxCleared;
        const rewardMult = isFirstClear ? 1.0 : 0.5; // 50% for repeat clears (as per user request "những lần sau sẽ nhận được ít hơn")

        // Stats with Buffs
        const territory = await db.queryOne('SELECT guild_id FROM guild_territories WHERE region_id = $1', [player.current_region]);
        const isGuildTerritory = (territory && player.guild_id === territory.guild_id);
        const buffMult = isGuildTerritory ? 2 : 1;
        const regionBuff = region.buff || {};

        let pBaseDmg = regionBuff.atk_bonus ? Math.floor(stats.attack * (1 + regionBuff.atk_bonus * buffMult)) : stats.attack;
        let pDef = regionBuff.defense_bonus ? Math.floor(stats.defense * (1 + regionBuff.defense_bonus * buffMult)) : stats.defense;
        let pMaxHp = regionBuff.hp_bonus ? Math.floor(player.max_hp * (1 + regionBuff.hp_bonus * buffMult)) : player.max_hp;
        let pHp = session ? session.hp : player.hp;

        // --- APPLY EXPLORE MODIFIERS ---
        let expMultTotal = 1.0;
        if (session && session.modifier) {
            const mod = rpgData.EXPLORE_MODIFIERS[session.modifier];
            if (mod.atk_mult) pBaseDmg = Math.floor(pBaseDmg * mod.atk_mult);
            if (mod.def_mult) pDef = Math.floor(pDef * mod.def_mult);
            if (mod.exp_mult) expMultTotal *= mod.exp_mult;
        }

        let log = isGuildTerritory ? `Castle **Lãnh Địa Bang Hội**: Buff vùng đất x2!\n` : '';

        // --- TURN PROCESSING ---
        let usedPotion = null;
        let healAmount = 0;
        let potionName = '';

        if (action === 'heal') {
            const potions = await db.queryAll(
                'SELECT item_id, amount FROM inventory WHERE user_id = $1 AND item_id IN (\'minor_healing_potion\', \'healing_potion\', \'major_healing_potion\') AND amount > 0 ORDER BY CASE item_id WHEN \'minor_healing_potion\' THEN 1 WHEN \'healing_potion\' THEN 2 WHEN \'major_healing_potion\' THEN 3 END ASC', 
                [userId]
            );

            if (!potions || potions.length === 0) {
                return interaction.reply({ 
                    content: '❌ Bạn không có bất kỳ thuốc hồi phục nào trong túi đồ (Gồm: Thuốc hồi máu nhỏ/vừa/lớn)! Hãy mua thêm ở `/shop`.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const potion = potions[0];
            usedPotion = potion.item_id;
            if (usedPotion === 'minor_healing_potion') {
                healAmount = 50;
                potionName = 'Thuốc Hồi Máu Nhỏ 🧪';
            } else if (usedPotion === 'healing_potion') {
                healAmount = 150;
                potionName = 'Thuốc Hồi Máu 🧪';
            } else {
                healAmount = 300;
                potionName = 'Thuốc Hồi Máu Lớn 🧪';
            }

            pHp = Math.min(pMaxHp, pHp + healAmount);
            log += `🧪 Bạn sử dụng **${potionName}**, phục hồi **+${healAmount} HP**.\n`;

            if (potion.amount <= 1) {
                await db.execute('DELETE FROM inventory WHERE user_id = $1 AND item_id = $2', [userId, usedPotion]);
            } else {
                await db.execute('UPDATE inventory SET amount = amount - 1 WHERE user_id = $1 AND item_id = $2', [userId, usedPotion]);
            }
        }

        const { playerHP: nextPHp, monsterHP: nextMHp, log: statusLog, effects: nextEffects, pEffects: nextPEffects } = combatLogic.processStatusEffects(pHp, mHp, player.status_effects || [], mStatusEffects);
        pHp = nextPHp;
        mHp = nextMHp;
        log += statusLog;
        mStatusEffects = nextEffects;
        let pStatusEffects = nextPEffects;

        // --- SKILL TRIGGERING ---
        const learnedSkills = await db.getPlayerSkills(userId);
        const skillTrigger = mHp > 0 && pHp > 0 ? combatLogic.triggerCombatSkills(learnedSkills, player.class, player) : null;

        if (mHp > 0 && pHp > 0 && action === 'attack') {
            if (skillTrigger && player.mana >= (skillTrigger.mana_cost || 0)) {
                // Skills consume mana
                const manaCost = skillTrigger.mana_cost || 0;
                player.mana -= manaCost;

                let skillDmg = Math.floor(pBaseDmg * skillTrigger.multiplier);
                const elemMult = combatLogic.getElementalMultiplier(skillTrigger.element, monster.element);
                skillDmg = Math.floor(skillDmg * elemMult);

                mHp = Math.max(0, mHp - skillDmg);
                log += `🪄 Bạn ${skillTrigger.msg} (**-${manaCost} Mana**)\n`;
                log += `💥 Gây **${skillDmg}** sát thương${elemMult > 1 ? ' (Ưu thế hệ!)' : ''}.\n`;

                if (skillTrigger.effect === 'heal' || skillTrigger.effect === 'drain') {
                    const heal = Math.floor(pMaxHp * (skillTrigger.heal_pct || 0.1));
                    pHp = Math.min(pMaxHp, pHp + heal);
                    log += `💚 Bạn được hồi phục **+${heal} HP**.\n`;
                }
                
                if (skillTrigger.status && Math.random() < 0.3) {
                    mStatusEffects.push({ type: skillTrigger.status, duration: 3 });
                    log += `✨ Quái vật bị dính trạng thái **${skillTrigger.status}**!\n`;
                }
            } else {
                const { damage, isCrit } = combatLogic.calculateCrit(pBaseDmg, 0, stats.crit_rate, stats.crit_damage);
                let finalDmg = damage;
                if (playerPassives.includes('dragon_hunter') && monster.type === 'Dragon') {
                    finalDmg = Math.floor(finalDmg * 1.5);
                    log += `🐉 **Diệt Rồng**: Sát thương x1.5!\n`;
                }
                mHp = Math.max(0, mHp - finalDmg);
                log += `⚔️ Bạn gây **${finalDmg}** sát thương${isCrit ? ' (BẠO KÍCH)' : ''}.\n`;
            }
        }

        if (mHp > 0 && pHp > 0) {
            let mDmg = Math.max(1, mAtk - pDef);
            pHp = Math.max(0, pHp - mDmg);
            log += `💢 Monster tấn công gây **${mDmg}** sát thương.\n`;
        }

        // --- WIN/LOSS/CONTINUE ---
        if (mHp <= 0) {
            let goldMult = 1.0;
            let expMult = 1.0;
            let itemBonus = 0;
            if (session && session.petId) {
                const pet = require('../utils/petsData').getPet(session.petId);
                if (pet && pet.explore_buffs) {
                    const eb = pet.explore_buffs;
                    if (eb.gold_mult) goldMult += (eb.gold_mult - 1);
                    if (eb.exp_mult) expMult += (eb.exp_mult - 1);
                    if (eb.reward_mult) {
                        goldMult += (eb.reward_mult - 1);
                        expMult += (eb.reward_mult - 1);
                    }
                    if (eb.item_roll_bonus) itemBonus = eb.item_roll_bonus;
                }
            }

            const gold = Math.floor((isShiny ? monster.gold * 5 : monster.gold) * rewardMult * diffRewardsMult * goldMult);
            const exp = Math.floor((isShiny ? monster.exp * 5 : monster.exp) * expMultTotal * rewardMult * diffRewardsMult * expMult);
            
            let rewardMsg = isFirstClear ? `🏆 **THƯỞNG LẦN ĐẦU VƯỢT TẦNG!**\n` : `🔄 **VƯỢT TẦNG LẠI (50% Thưởng)**\n`;
            rewardMsg += `✨ Độ khó **${difficultyNames[difficulty]}**: x${diffRewardsMult} Thưởng\n`;
            rewardMsg += `💰 +${gold} Gold | 🌟 +${exp} EXP`;
            let itemsToClaim = [];

            if (isShiny) {
                await sendGlobal(interaction.client, 'Hào Quang Tỏa Sáng!', `<@${userId}> hạ gục **${mName}** hiếm!`, '#f1c40f');
                itemsToClaim.push('shiny_essence');
            }

            const dropRoll = Math.random() - itemBonus;
            if (dropRoll < 0.2) {
                const possibleDrops = ['iron_ore', 'bronze_scrap', 'medicinal_herb'];
                itemsToClaim.push(possibleDrops[Math.floor(Math.random() * possibleDrops.length)]);
            } else if (dropRoll < 0.25) {
                const rareDrops = ['ruby', 'emerald', 'sapphire', 'magic_core'];
                itemsToClaim.push(rareDrops[Math.floor(Math.random() * rareDrops.length)]);
            }

            await db.withTransaction(async (client) => {
                await questLogic.addProgress(userId, 'kill_monster', 1, client);
                await questLogic.addProgress(userId, 'earn_gold', gold, client);

                // Increment region kills for boss spawn if boss exists and is currently dead/hidden
                const regionId = player.current_region;
                const boss = require('../utils/bossData')[regionId];
                if (boss) {
                    const hpState = await client.query('SELECT value FROM world_states WHERE key = $1', [`${regionId}_boss_hp`]).then(r => r.rows[0]);
                    const currentHp = hpState ? parseInt(hpState.value) : 0;
                    
                    if (currentHp <= 0) {
                        const killsState = await client.query('SELECT value FROM world_states WHERE key = $1', [`${regionId}_kills`]).then(r => r.rows[0]);
                        let currentKills = killsState ? parseInt(killsState.value) : 0;
                        currentKills++;
                        
                        if (currentKills >= boss.spawn_req) {
                            // Spawn the boss!
                            await client.query(
                                'INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', 
                                [`${regionId}_boss_hp`, boss.max_hp.toString()]
                            );
                            await client.query(
                                'INSERT INTO world_states (key, value) VALUES ($1, \'0\') ON CONFLICT (key) DO UPDATE SET value = \'0\'', 
                                [`${regionId}_kills`]
                            );
                            
                            // Send spawn global broadcast announcement
                            const rpgData = require('../utils/rpgData');
                            const regionName = rpgData[regionId]?.name || regionId;
                            await sendGlobal(
                                interaction.client, 
                                '💥 BOSS XUẤT HIỆN! 💥', 
                                `⚠️ **${boss.name}** đã xuất hiện tại **${regionName}**!\nHãy dùng lệnh \`/boss\` để lập tức tham gia tiêu diệt nó!`, 
                                '#e74c3c'
                            );
                        } else {
                            await client.query(
                                'INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', 
                                [`${regionId}_kills`, currentKills.toString()]
                            );
                        }
                    }
                }

                for (const item of itemsToClaim) {
                    const it = itemsData.getItem(item) || require('../utils/materialsData').getMaterial(item);
                    rewardMsg += `\n🎁 +1 **${it?.name || item}**`;
                    
                    if (session) {
                        session.accumulatedRewards.items.push(item);
                    } else {
                        await client.query('INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [userId, item]);
                    }

                    if (it && (it.rarity === 'Legendary' || it.rarity === 'Mythic' || it.rarity === 'Epic')) {
                        await sendGlobal(interaction.client, 'VẬT PHẨM QUÝ HIẾM!', `<@${userId}> vừa nhặt được **${it.name}** (${it.rarity})!`, '#9b59b6');
                    }
                }

                if (session) {
                    session.accumulatedRewards.gold += gold;
                    session.accumulatedRewards.exp += exp;
                    session.monster = null;
                    session.hp = Math.floor(pHp) || 0;
                    session.statusEffects = pStatusEffects;
                    sessionManager.updateSession(userId, session);
                    await client.query('UPDATE players SET hp = $1, status_effects = $2 WHERE user_id = $3', [session.hp, JSON.stringify(pStatusEffects), userId]);
                    
                    // Update exploration progress
                    if (isFirstClear) {
                        await client.query('INSERT INTO player_exploration (user_id, region_id, max_floor) VALUES ($1, $2, $3) ON CONFLICT (user_id, region_id) DO UPDATE SET max_floor = GREATEST(player_exploration.max_floor, $3)', [userId, player.current_region, session.progress]);
                    }
                } else {
                    await client.query('UPDATE players SET gold = gold + $1, hp = $2, mana = $3, status_effects = $4 WHERE user_id = $5', [gold, Math.floor(pHp) || 0, player.mana, JSON.stringify(pStatusEffects), userId]);
                    await rpgLogic.addExp(userId, exp, client);
                }
            });

            const winEmbed = new EmbedBuilder().setTitle('Chiến Thắng!').setDescription(log + `\n${rewardMsg}`).setColor('#2ecc71');
            
            // Re-attach image for win screen if we want to keep it
            const imgPath = path.join(process.cwd(), 'src', 'assets', 'monsters', player.current_region, monster.image || 'placeholder.png');
            let files = [];
            if (fs.existsSync(imgPath)) {
                const attachment = new AttachmentBuilder(imgPath, { name: 'monster.png' });
                winEmbed.setImage('attachment://monster.png');
                files.push(attachment);
            }

            const row = session ? new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣'),
                new ButtonBuilder().setCustomId('session_finish').setLabel('Rút Lui').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            ) : null;
            return interaction.update({ embeds: [winEmbed], components: row ? [row] : [], files: files });
        }

        if (pHp <= 0) {
             if (session) sessionManager.endSession(userId);
             await db.execute('UPDATE players SET hp = 0, dead_until = $1, status_effects = \'[]\'::jsonb WHERE user_id = $2', [Date.now() + 1800000, userId]);
             return interaction.update({ content: '💀 Bạn đã gục ngã!', embeds: [], components: [] });
        }

        // Continue
        if (session) {
            session.hp = Math.floor(pHp) || 0;
            session.monster.hp = mHp;
            session.monster.statusEffects = mStatusEffects;
             session.statusEffects = pStatusEffects;
            sessionManager.updateSession(userId, session);
        }
        await db.execute('UPDATE players SET hp = $1, mana = $2, status_effects = $3 WHERE user_id = $4', [Math.floor(pHp) || 0, player.mana, JSON.stringify(pStatusEffects), userId]);

        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Chiến Đấu - Tầng ${session ? session.progress : '?'}`)
            .setDescription(log)
            .addFields(
                { name: `👾 ${mName}`, value: createHealthBar(mHp, mMaxHp) + ` (${mHp}/${mMaxHp})`, inline: false },
                { name: '🛡️ Bạn', value: createHealthBar(pHp, pMaxHp) + ` (${pHp}/${pMaxHp})`, inline: false }
            ).setColor('#e67e22');

        const imgPath = path.join(process.cwd(), 'src', 'assets', 'monsters', player.current_region, monster.image || 'placeholder.png');
        let files = [];
        if (fs.existsSync(imgPath)) {
            const attachment = new AttachmentBuilder(imgPath, { name: 'monster.png' });
            embed.setImage('attachment://monster.png');
            files.push(attachment);
        } else {
            const placeholder = path.join(process.cwd(), 'src', 'assets', 'monsters', 'placeholder.png');
            if (fs.existsSync(placeholder)) {
                files.push(new AttachmentBuilder(placeholder, { name: 'monster.png' }));
                embed.setImage('attachment://monster.png');
            }
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`battle_${monsterId}_${mHp}_${isShiny ? 1 : 0}_${difficulty}`).setLabel('Tấn Công').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
            new ButtonBuilder().setCustomId(`use_hp_${monsterId}_${mHp}_${isShiny ? 1 : 0}_${difficulty}`).setLabel('Bơm Máu').setStyle(ButtonStyle.Success).setEmoji('🧪'),
            new ButtonBuilder().setCustomId('session_finish').setLabel('Bỏ Chạy').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
        );

        return interaction.update({ embeds: [embed], components: [row], files: files });
    }

    static async handleBossBattle(interaction, userId, regionId) {
        const bossData = require('../utils/bossData');
        const boss = bossData[regionId];
        if (!boss) return interaction.reply({ content: 'Lỗi Boss dữ liệu.', flags: MessageFlags.Ephemeral });

        const player = await db.getPlayer(userId);
        if (!player || player.hp <= 0) return interaction.reply({ content: 'Bạn không thể chiến đấu!', flags: MessageFlags.Ephemeral });

        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const weapon = equip?.weapon_id ? itemsData.getItem(equip.weapon_id) : null;

        const { damage: pDmgBase, isCrit } = combatLogic.calculateCrit(stats.attack, 0, stats.crit_rate, stats.crit_damage);
        const pElemMult = combatLogic.getElementalMultiplier(weapon?.element, null); 
        let finalDmg = Math.floor(pDmgBase * pElemMult);

        const hpState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${regionId}_boss_hp`]);
        let currentHp = hpState ? parseInt(hpState.value) : 0;
        if (currentHp <= 0) return interaction.update({ content: '🎉 Boss đã bị tiêu diệt bởi người khác!', embeds: [], components: [] });

        finalDmg = Math.min(finalDmg, currentHp);
        currentHp -= finalDmg;

        let contributors = [];
        await db.withTransaction(async (client) => {
            await client.query('INSERT INTO world_boss_damage (region_id, user_id, damage) VALUES ($1, $2, $3) ON CONFLICT (region_id, user_id) DO UPDATE SET damage = world_boss_damage.damage + $3, last_hit = CURRENT_TIMESTAMP', [regionId, userId, finalDmg]);
            await client.query('UPDATE world_states SET value = $1 WHERE key = $2', [currentHp.toString(), `${regionId}_boss_hp`]);

            let mDmg = Math.max(1, boss.atk - Math.floor(stats.defense / 2));
            let pHp = Math.max(0, player.hp - mDmg);
            await client.query('UPDATE players SET hp = $1 WHERE user_id = $2', [pHp, userId]);

            if (currentHp <= 0) {
                const rpgData = require('../utils/rpgData');
                contributors = await client.query('SELECT * FROM world_boss_damage WHERE region_id = $1 ORDER BY damage DESC', [regionId]).then(r => r.rows);
                
                for (const [index, cont] of contributors.entries()) {
                    const totalDamage = Number(cont.damage);
                    const share = totalDamage / boss.max_hp;
                    const goldRew = Math.floor(boss.gold * share) + (index === 0 ? 500 : 0);
                    const expRew = Math.floor(boss.exp * share) + (index === 0 ? 1000 : 0);
                    
                    await client.query('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [goldRew, cont.user_id]);
                    await rpgLogic.addExp(cont.user_id, expRew, client);
                    await questLogic.addProgress(cont.user_id, 'kill_boss', 1, client);
                    await questLogic.addProgress(cont.user_id, 'earn_gold', goldRew, client);
                }
                await client.query('DELETE FROM world_boss_damage WHERE region_id = $1', [regionId]);
                await client.query('UPDATE world_states SET value = \'0\' WHERE key = $1', [`${regionId}_kills`]);
            }
        });

        const log = `⚔️ Bạn gây **${finalDmg}** sát thương lên **${boss.name}**!${isCrit ? ' (BẠO KÍCH)' : ''}\n`;
        const mDmgReal = Math.max(1, boss.atk - Math.floor(stats.defense / 2));
        const pHpReal = Math.max(0, player.hp - mDmgReal);

        if (currentHp <= 0) {
             const rpgData = require('../utils/rpgData');
             const regionName = rpgData[regionId]?.name || regionId;
             
             let description = `🏆 **${boss.name}** đã bị tiêu diệt tại **${regionName}**!\n\n` +
                               `📊 **Bảng Xếp Hạng Sát Thương:**\n`;
             
             for (const [index, cont] of contributors.entries()) {
                 const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : '👤'));
                 description += `${medal} <@${cont.user_id}>: **${Number(cont.damage).toLocaleString()} Sát thương**\n`;
             }
             
             const winEmbed = new EmbedBuilder()
                 .setTitle('🎉 CHIẾN THẮNG WORLD BOSS! 🎉')
                 .setDescription(description)
                 .setColor('#f1c40f')
                 .setTimestamp();
             
             const messageText = `🎉 **${boss.name}** đã ngã xuống! Chúc mừng các dũng sĩ đã tham gia trận chiến. Phần thưởng đã được gửi trực tiếp vào tài khoản!`;

             // Send a global victory announcement
             await sendGlobal(
                 interaction.client, 
                 '🏆 TIÊU DIỆT WORLD BOSS SUCCESS! 🏆', 
                 `🎉 **${boss.name}** tại **${regionName}** đã bị tiêu diệt bởi các dũng sĩ!\n` +
                 `🥇 MVP gây sát thương lớn nhất: ${contributors[0] ? `<@${contributors[0].user_id}>` : 'Không rõ'}!`,
                 '#f1c40f'
             );

             return interaction.update({ content: messageText, embeds: [winEmbed], components: [] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Chiến Đấu Boss: ${boss.name}`)
            .setDescription(`${createHealthBar(currentHp, boss.max_hp)}\n**HP:** ${currentHp}/${boss.max_hp}\n\n${log}\n💢 Boss phản đòn gây **${mDmgReal}** sát thương. HP còn: ${pHpReal}/${player.max_hp}`)
            .setColor('#e74c3c');

        const imgPath = path.join(process.cwd(), 'src', 'assets', 'monsters', regionId, boss.image || 'placeholder.png');
        let files = [];
        if (fs.existsSync(imgPath)) {
            const attachment = new AttachmentBuilder(imgPath, { name: 'monster.png' });
            embed.setImage('attachment://monster.png');
            files.push(attachment);
        }

        const row = new ActionRowBuilder().addComponents(
             new ButtonBuilder().setCustomId(`boss_attack_${regionId}`).setLabel('Tiếp Tục Tấn Công').setStyle(ButtonStyle.Danger).setEmoji('⚔️')
        );

        return interaction.update({ embeds: [embed], components: [row], files: files });
    }
}

module.exports = CombatService;
