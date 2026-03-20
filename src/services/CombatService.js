const db = require('../database');
const combatLogic = require('../utils/combatLogic');
const rpgLogic = require('../utils/rpgLogic');
const questLogic = require('../utils/questLogic');
const sessionManager = require('../utils/sessionManager');
const itemsData = require('../utils/itemsData');
const { sendGlobal } = require('../utils/broadcast');
const { createHealthBar } = require('../utils/uiHelper');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class CombatService {
    static async handleBattle(interaction, userId, monsterId, mHp, isShiny, action = 'attack') {
        const session = sessionManager.getSession(userId);
        const player = await db.getPlayer(userId);
        if (!player || player.hp <= 0) return interaction.reply({ content: 'Bạn không thể chiến đấu!', flags: 64 });

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

        // Find monster
        const rpgData = require('../utils/rpgData');
        const region = rpgData[player.current_region];
        const monster = region.monsters.find(m => m.id === monsterId);
        if (!monster) return interaction.reply({ content: 'Quái vật đã hết hạn!', flags: 64 });

        let mMaxHp = isShiny ? Math.floor(monster.hp * 1.5) : monster.hp;
        let mAtk = isShiny ? Math.floor(monster.atk * 1.5) : monster.atk;
        let mName = isShiny ? `✨ Shiny ${monster.name}` : monster.name;
        let mStatusEffects = (session && session.monster) ? session.monster.statusEffects : [];

        // Stats with Buffs
        const territory = await db.queryOne('SELECT guild_id FROM guild_territories WHERE region_id = $1', [player.current_region]);
        const isGuildTerritory = (territory && player.guild_id === territory.guild_id);
        const buffMult = isGuildTerritory ? 2 : 1;
        const regionBuff = region.buff || {};

        let pBaseDmg = regionBuff.atk_bonus ? Math.floor(stats.attack * (1 + regionBuff.atk_bonus * buffMult)) : stats.attack;
        let pDef = regionBuff.defense_bonus ? Math.floor(stats.defense * (1 + regionBuff.defense_bonus * buffMult)) : stats.defense;
        let pMaxHp = regionBuff.hp_bonus ? Math.floor(player.max_hp * (1 + regionBuff.hp_bonus * buffMult)) : player.max_hp;
        let pHp = session ? session.hp : player.hp;

        let log = isGuildTerritory ? `🏰 **Lãnh Địa Bang Hội**: Buff vùng đất x2!\n` : '';

        // --- TURN PROCESSING ---
        if (action === 'heal') {
            const heal = Math.floor(pMaxHp * 0.3);
            pHp = Math.min(pMaxHp, pHp + heal);
            log += `🧪 Bạn sử dụng thuốc hồi phục **+${heal} HP**.\n`;
        }

        const { playerHP: nextPHp, monsterHP: nextMHp, log: statusLog, effects: nextEffects } = combatLogic.processStatusEffects(pHp, mHp, player.status_effects || [], mStatusEffects);
        pHp = nextPHp;
        mHp = nextMHp;
        log += statusLog;
        mStatusEffects = nextEffects;

        if (mHp > 0 && pHp > 0 && action === 'attack') {
            const { damage, isCrit } = combatLogic.calculateCrit(pBaseDmg, 0, stats.crit_rate, stats.crit_damage); // Monsters have 0 def for now or we could add it
            let finalDmg = damage;
            if (playerPassives.includes('dragon_hunter') && monster.type === 'Dragon') {
                finalDmg = Math.floor(finalDmg * 1.5);
                log += `🐉 **Diệt Rồng**: Sát thương x1.5!\n`;
            }
            mHp = Math.max(0, mHp - finalDmg);
            log += `⚔️ Bạn gây **${finalDmg}** sát thương${isCrit ? ' (BẠO KÍCH)' : ''}.\n`;
        }

        if (mHp > 0 && pHp > 0) {
            let mDmg = Math.max(1, mAtk - pDef);
            pHp = Math.max(0, pHp - mDmg);
            log += `💢 Monster tấn công gây **${mDmg}** sát thương.\n`;
        }

        // --- WIN/LOSS/CONTINUE ---
        if (mHp <= 0) {
            const gold = isShiny ? monster.gold * 5 : monster.gold;
            const exp = isShiny ? monster.exp * 5 : monster.exp;
            await questLogic.addProgress(userId, 'kill_monster', 1);
            await questLogic.addProgress(userId, 'earn_gold', gold);
            
            let rewardMsg = `💰 +${gold} Gold | 🌟 +${exp} EXP`;
            let itemsToClaim = [];

            if (isShiny) {
                await sendGlobal(interaction.client, 'Hào Quang Tỏa Sáng!', `<@${userId}> hạ gục **${mName}** hiếm!`, '#f1c40f');
                itemsToClaim.push('shiny_essence');
            }

            // Normal dynamic drops
            const dropRoll = Math.random();
            if (dropRoll < 0.2) {
                const possibleDrops = ['iron_ore', 'bronze_scrap', 'medicinal_herb'];
                const selected = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
                itemsToClaim.push(selected);
            } else if (dropRoll < 0.25) {
                const rareDrops = ['ruby', 'emerald', 'sapphire', 'magic_core'];
                const selected = rareDrops[Math.floor(Math.random() * rareDrops.length)];
                itemsToClaim.push(selected);
            }

            for (const item of itemsToClaim) {
                const it = itemsData.getItem(item) || require('../utils/materialsData').getMaterial(item);
                rewardMsg += `\n🎁 +1 **${it?.name || item}**`;
                if (session) {
                    session.accumulatedRewards.items.push(item);
                } else {
                    await db.execute('INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [userId, item]);
                }
                
                // --- ANNOUNCE RARE DROP ---
                if (it && (it.rarity === 'Legendary' || it.rarity === 'Mythic' || it.rarity === 'Epic')) {
                    await sendGlobal(interaction.client, 'VẬT PHẨM QUÝ HIẾM!', `<@${userId}> vừa nhặt được **${it.name}** (${it.rarity})!`, '#9b59b6');
                }
            }

            if (session) {
                session.accumulatedRewards.gold += gold;
                session.accumulatedRewards.exp += exp;
                session.monster = null;
                session.hp = pHp;
                sessionManager.updateSession(userId, session);
            } else {
                await db.execute('UPDATE players SET gold = gold + $1, hp = $2 WHERE user_id = $3', [gold, pHp, userId]);
                await rpgLogic.addExp(userId, exp);
            }

            const winEmbed = new EmbedBuilder().setTitle('Chiến Thắng!').setDescription(log + `\n${rewardMsg}`).setColor('#2ecc71');
            const row = session ? new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('session_continue').setLabel('Tiếp Tục').setStyle(ButtonStyle.Primary).setEmoji('👣'),
                new ButtonBuilder().setCustomId('session_finish').setLabel('Rút Lui').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            ) : null;
            return interaction.update({ embeds: [winEmbed], components: row ? [row] : [] });
        }

        if (pHp <= 0) {
             if (session) sessionManager.endSession(userId);
             await db.execute('UPDATE players SET hp = 0, dead_until = $1 WHERE user_id = $2', [Date.now() + 300000, userId]);
             return interaction.update({ content: '💀 Bạn đã gục ngã!', embeds: [], components: [] });
        }

        // Continue
        if (session) {
            session.hp = pHp;
            session.monster.hp = mHp;
            session.monster.statusEffects = mStatusEffects;
            sessionManager.updateSession(userId, session);
        }
        await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [pHp, userId]);

        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Chiến Đấu - Tầng ${session ? session.progress : '?'}`)
            .setDescription(log)
            .addFields(
                { name: `👾 ${mName}`, value: createHealthBar(mHp, mMaxHp) + ` (${mHp}/${mMaxHp})`, inline: false },
                { name: '🛡️ Bạn', value: createHealthBar(pHp, pMaxHp) + ` (${pHp}/${pMaxHp})`, inline: false }
            ).setColor('#e67e22');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`battle_${monsterId}_${mHp}_${isShiny}`).setLabel('Tấn Công').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
            new ButtonBuilder().setCustomId(`use_hp_${monsterId}_${mHp}_${isShiny}`).setLabel('Bơm Máu').setStyle(ButtonStyle.Success).setEmoji('🧪'),
            new ButtonBuilder().setCustomId('session_finish').setLabel('Bỏ Chạy').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
        );

        return interaction.update({ embeds: [embed], components: [row] });
    }

    static async handleBossBattle(interaction, userId, regionId) {
        const bossData = require('../utils/bossData');
        const boss = bossData[regionId];
        if (!boss) return interaction.reply({ content: 'Lỗi Boss dữ liệu.', flags: 64 });

        const player = await db.getPlayer(userId);
        if (!player || player.hp <= 0) return interaction.reply({ content: 'Bạn không thể chiến đấu!', flags: 64 });

        const stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [userId]);
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const weapon = equip?.weapon_id ? itemsData.getItem(equip.weapon_id) : null;

        const { damage: pDmgBase, isCrit } = combatLogic.calculateCrit(stats.attack, 0, stats.crit_rate, stats.crit_damage); // Bosses have massive HP instead of high def usually
        const pElemMult = combatLogic.getElementalMultiplier(weapon?.element, null); 
        let finalDmg = Math.floor(pDmgBase * pElemMult);

        const hpState = await db.queryOne('SELECT value FROM world_states WHERE key = $1', [`${regionId}_boss_hp`]);
        let currentHp = hpState ? parseInt(hpState.value) : 0;
        if (currentHp <= 0) return interaction.update({ content: '🎉 Boss đã bị tiêu diệt bởi người khác!', embeds: [], components: [] });

        finalDmg = Math.min(finalDmg, currentHp);
        currentHp -= finalDmg;

        await db.execute('INSERT INTO world_boss_damage (region_id, user_id, damage) VALUES ($1, $2, $3) ON CONFLICT (region_id, user_id) DO UPDATE SET damage = world_boss_damage.damage + $3, last_hit = CURRENT_TIMESTAMP', [regionId, userId, finalDmg]);
        await db.execute('UPDATE world_states SET value = $1 WHERE key = $2', [currentHp.toString(), `${regionId}_boss_hp`]);

        let log = `⚔️ Bạn gây **${finalDmg}** sát thương lên **${boss.name}**!${isCrit ? ' (BẠO KÍCH)' : ''}\n`;
        let mDmg = Math.max(1, boss.atk - Math.floor(stats.defense / 2));
        let pHp = Math.max(0, player.hp - mDmg);
        await db.execute('UPDATE players SET hp = $1 WHERE user_id = $2', [pHp, userId]);
        log += `💢 Boss phản đòn gây **${mDmg}** sát thương. HP còn: ${pHp}/${player.max_hp}`;

        if (currentHp <= 0) {
            const rpgData = require('../utils/rpgData');
            const contributors = await db.query('SELECT * FROM world_boss_damage WHERE region_id = $1 ORDER BY damage DESC', [regionId]);
            let rewardLog = `🎊 **CHÚC MỪNG!** ${boss.name} đã ngã xuống!\n\n**Bảng xếp hạng sát thương:**\n`;
            
            for (const [index, cont] of contributors.entries()) {
                const totalDamage = Number(cont.damage);
                const share = totalDamage / boss.max_hp;
                const goldRew = Math.floor(boss.gold * share) + (index === 0 ? 500 : 0);
                const expRew = Math.floor(boss.exp * share) + (index === 0 ? 1000 : 0);
                
                await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [goldRew, cont.user_id]);
                await rpgLogic.addExp(cont.user_id, expRew);
                await questLogic.addProgress(cont.user_id, 'kill_boss', 1);
                await questLogic.addProgress(cont.user_id, 'earn_gold', goldRew);
                
                rewardLog += `${index + 1}. <@${cont.user_id}>: ${totalDamage} dmg (+${goldRew} gold, +${expRew} exp)\n`;

                if (index === 0) {
                    const mvpPlayer = await db.getPlayer(cont.user_id);
                    if (mvpPlayer.guild_id) {
                        const guild = await db.queryOne('SELECT name FROM guilds WHERE guild_id = $1', [mvpPlayer.guild_id]);
                        await db.execute('INSERT INTO guild_territories (region_id, guild_id) VALUES ($1, $2) ON CONFLICT (region_id) DO UPDATE SET guild_id = EXCLUDED.guild_id, captured_at = (extract(epoch from now()))', [regionId, mvpPlayer.guild_id]);
                        rewardLog += `🏰 **${guild.name}** đã chiếm đóng thành công vùng đất này!\n`;
                    }
                }
            }

            // Drops
            for (let i = 0; i < Math.min(3, contributors.length); i++) {
                if (Math.random() < 0.5) {
                    const drop = boss.drops[Math.floor(Math.random() * boss.drops.length)];
                    await db.execute('INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [contributors[i].user_id, drop]);
                    const it = itemsData.getItem(drop);
                    rewardLog += `🎁 <@${contributors[i].user_id}> nhận được **${it?.name || drop}**!${(it && (it.rarity === 'Legendary' || it.rarity === 'Mythic')) ? ' (CỰC HIẾM!)' : ''}\n`;
                    
                    if (it && (it.rarity === 'Legendary' || it.rarity === 'Mythic')) {
                        await sendGlobal(interaction.client, 'VẬT PHẨM QUÝ HIẾM!', `<@${contributors[i].user_id}> vừa nhận được **${it.name}** từ Boss!`, '#9b59b6');
                    }
                }
            }

            await db.execute('DELETE FROM world_boss_damage WHERE region_id = $1', [regionId]);
            await db.execute('UPDATE world_states SET value = \'0\' WHERE key = $1', [`${regionId}_kills`]);

            // Broadcast
            const mvp = contributors[0];
            let guildMsg = "";
            if (mvp) {
                const mvpPlayer = await db.getPlayer(mvp.user_id);
                if (mvpPlayer.guild_id) {
                    const g = await db.queryOne('SELECT name FROM guilds WHERE guild_id = $1', [mvpPlayer.guild_id]);
                    if (g) guildMsg = ` (Bang Hội: **${g.name}**)`;
                }
            }
            await sendGlobal(interaction.client, 'BOSS THÀNH BẠI!', `**${boss.name}** đã gục ngã tại **${rpgData[regionId].name}**!\n🏆 **MVP:** <@${mvp?.user_id}>${guildMsg}`, '#e74c3c');

            return interaction.update({ embeds: [new EmbedBuilder().setTitle('🏆 Boss Tử Trận!').setDescription(rewardLog).setColor('#f1c40f')], components: [] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Chiến Đấu Boss: ${boss.name}`)
            .setDescription(`${createHealthBar(currentHp, boss.max_hp)}\n**HP:** ${currentHp}/${boss.max_hp}\n\n${log}`)
            .setColor('#e74c3c');

        const row = new ActionRowBuilder().addComponents(
             new ButtonBuilder().setCustomId(`boss_attack_${regionId}`).setLabel('Tiếp Tục Tấn Công').setStyle(ButtonStyle.Danger).setEmoji('⚔️')
        );

        return interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = CombatService;
