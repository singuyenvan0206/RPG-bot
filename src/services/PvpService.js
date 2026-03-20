const db = require('../database');
const combatLogic = require('../utils/combatLogic');
const itemsData = require('../utils/itemsData');
const { createHealthBar } = require('../utils/uiHelper');
const { EmbedBuilder } = require('discord.js');

class PvpService {
    static getRankInfo(elo) {
        if (elo < 1200) return { name: '🟤 Bronze', color: '#cd7f32' };
        if (elo < 1500) return { name: '⚪ Silver', color: '#c0c0c0' };
        if (elo < 2000) return { name: '🟡 Gold', color: '#ffd700' };
        if (elo < 2500) return { name: '🔵 Platinum', color: '#e5e4e2' };
        if (elo < 3000) return { name: '💎 Diamond', color: '#b9f2ff' };
        return { name: '🔥 Challenger', color: '#ff4500' };
    }

    static async runBattle(interaction, player1, player2) {
        const p1Id = player1.user_id;
        const p2Id = player2.user_id;

        // Load stats
        const p1Stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [p1Id]);
        const p2Stats = await db.queryOne('SELECT * FROM player_stats WHERE user_id = $1', [p2Id]);
        
        // Load skills
        const p1Skills = await db.getPlayerSkills(p1Id);
        const p2Skills = await db.getPlayerSkills(p2Id);

        // Load Equipment for passives
        const p1Equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [p1Id]);
        const p2Equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [p2Id]);

        const getPassives = (equip) => {
            if (!equip) return [];
            const w = itemsData.getItem(equip.weapon_id);
            const a = itemsData.getItem(equip.armor_id);
            const acc = itemsData.getItem(equip.accessory_id);
            return [...(w?.passives || []), ...(a?.passives || []), ...(acc?.passives || [])];
        };

        const p1Passives = getPassives(p1Equip);
        const p2Passives = getPassives(p2Equip);

        let p1Hp = player1.max_hp;
        let p2Hp = player2.max_hp;
        const p1MaxHp = player1.max_hp;
        const p2MaxHp = player2.max_hp;

        let p1Status = [];
        let p2Status = [];
        
        let log = `⚔️ **${interaction.user.username}** vs **${player2.username || 'Đối thủ'}**\n\n`;
        let turn = 1;

        while (p1Hp > 0 && p2Hp > 0 && turn <= 20) {
            log += `**[Lượt ${turn}]**\n`;

            // --- Player 1 Status ---
            const s1 = combatLogic.processStatusEffects({ hp: p1Hp, max_hp: p1MaxHp, statusEffects: p1Status });
            p1Hp -= s1.damageTaken;
            if (s1.log) log += `🔹 ${interaction.user.username}: ${s1.log}`;

            // --- Player 1 Action ---
            if (p1Hp > 0 && p2Hp > 0 && !s1.skipTurn) {
                const skill = combatLogic.triggerCombatSkills(p1Skills, player1.class, player1);
                const { damage: dmg, isCrit } = combatLogic.calculateCrit(p1Stats.attack, p2Stats.defense, p1Stats.crit_rate, p1Stats.crit_damage);
                
                p2Hp -= dmg;
                log += `➡️ **${interaction.user.username}** ${skill ? `dùng **${skill.name}**` : 'tấn công'} gây **${dmg}** sát thương${isCrit ? ' (BẠO KÍCH)' : ''}.\n`;

                if (skill?.status) {
                    p2Status.push({ type: skill.status, duration: combatLogic.statusEffects[skill.status].duration });
                }
                if (skill?.heal_pct) {
                    const heal = Math.floor(p1MaxHp * skill.heal_pct);
                    p1Hp = Math.min(p1MaxHp, p1Hp + heal);
                    log += `💚 Hồi phục **${heal}** HP!\n`;
                }
            }

            if (p2Hp <= 0) break;

            // --- Player 2 Status ---
            const s2 = combatLogic.processStatusEffects({ hp: p2Hp, max_hp: p2MaxHp, statusEffects: p2Status });
            p2Hp -= s2.damageTaken;
            if (s2.log) log += `🔸 Đối thủ: ${s2.log}`;

            // --- Player 2 Action ---
            if (p2Hp > 0 && p1Hp > 0 && !s2.skipTurn) {
                const skill = combatLogic.triggerCombatSkills(p2Skills, player2.class, player2);
                const { damage: dmg, isCrit } = combatLogic.calculateCrit(p2Stats.attack, p1Stats.defense, p2Stats.crit_rate, p2Stats.crit_damage);
                
                p1Hp -= dmg;
                log += `⬅️ **Đối thủ** ${skill ? `dùng **${skill.name}**` : 'tấn công'} gây **${dmg}** sát thương${isCrit ? ' (BẠO KÍCH)' : ''}.\n`;

                if (skill?.status) p1Status.push({ type: skill.status, duration: combatLogic.statusEffects[skill.status].duration });
            }

            turn++;
            if (log.length > 1500) {
                log += `... Trận đấu quá dài, lược bớt nhật ký.\n`;
                break;
            }
        }

        const winnerId = p1Hp > p2Hp ? p1Id : p2Id;
        return { winnerId, log, p1Hp, p2Hp };
    }
}

module.exports = PvpService;
