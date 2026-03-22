const elements = {
    Fire: { beats: 'Wood', emoji: '🔥' },
    Wood: { beats: 'Earth', emoji: '🍃' },
    Earth: { beats: 'Water', emoji: '⛰️' },
    Water: { beats: 'Fire', emoji: '💧' },
    Void: { beats: 'Light', emoji: '🌑' },
    Light: { beats: 'Void', emoji: '✨' }
};

const statusEffects = {
    BURN: { name: 'Thiêu Đốt', emoji: '🔥', duration: 3 },
    POISON: { name: 'Trúng Độc', emoji: '🐍', duration: 3 },
    STUN: { name: 'Choáng', emoji: '😵', duration: 1 }
};

/**
 * Calculates the damage multiplier based on elemental advantage.
 * @param {string} attackerElement 
 * @param {string} defenderElement 
 * @returns {number} multiplier
 */
function getElementalMultiplier(attackerElement, defenderElement) {
    if (!attackerElement || !defenderElement) return 1.0;
    if (attackerElement === defenderElement) return 1.0;

    if (elements[attackerElement]?.beats === defenderElement) {
        return 1.25; // 25% bonus
    }

    if (elements[defenderElement]?.beats === attackerElement) {
        return 0.75; // 25% reduction
    }

    return 1.0;
}

const skillsData = require('./skillsData');

/**
 * Handles learned skill triggers during combat.
 * Only skills with an equipped_slot (1/2/3) will trigger.
 * @param {Array} learnedSkills List of {skill_id, level, equipped_slot} from DB
 * @param {string} className 
 * @param {object} player Player object (for heal calculations)
 * @returns {object|null} result { name, effect, multiplier, msg, type, heal_pct, dot_dmg, element, status }
 */
function triggerCombatSkills(learnedSkills, className, player) {
    if (!learnedSkills) return null;

    // Defensive: ensure array
    const skillsArray = Array.isArray(learnedSkills) ? learnedSkills : (learnedSkills.rows || []);

    // Only use skills that are equipped in one of the 3 slots
    const equippedSkills = skillsArray.filter(ls => ls.equipped_slot !== null && ls.equipped_slot !== undefined);
    if (equippedSkills.length === 0) return null;

    // Map to skill definitions
    const possibleSkills = equippedSkills.map(ls => {
        const data = skillsData[className]?.find(s => s.id === ls.skill_id);
        if (!data || data.type !== 'active') return null;
        return { ...data, level: ls.level };
    }).filter(s => s !== null);

    if (possibleSkills.length === 0) return null;

    const roll = Math.random();
    for (const skill of possibleSkills) {
        const triggerChance = skill.chance || 0.15;
        // +1% per level above 1
        const finalChance = triggerChance + (skill.level - 1) * 0.01;

        if (roll < finalChance) {
            let msg = skill.msg || `sử dụng **${skill.name}**!`;
            const finalMultiplier = (skill.multiplier || 1.0) + (skill.level - 1) * 0.05;

            return {
                name: skill.name,
                id: skill.id,
                effect: skill.effect || 'attack',
                multiplier: finalMultiplier,
                element: skill.element || null,
                heal_pct: skill.heal_pct || 0,
                dot_dmg: skill.dot_dmg || 0,
                status: skill.status || null,
                mana_cost: skill.mana_cost || 0,
                msg: msg,
                type: skill.type
            };
        }
    }
    return null;
}

/**
 * Calculates critical hit damage.
 * @param {number} baseAtk 
 * @param {number} def 
 * @param {number} critRate 
 * @param {number} critDamage 
 * @returns {object} { damage, isCrit }
 */
function calculateCrit(baseAtk, def, critRate, critDamage) {
    const isCrit = Math.random() < critRate;
    const rawDamage = isCrit ? Math.floor(baseAtk * critDamage) : baseAtk;
    
    // Mitigation formula: dmg = raw * (100 / (100 + def))
    const mitFactor = 100 / (100 + (def || 0));
    const damage = Math.max(1, Math.floor(rawDamage * mitFactor));
    
    return { damage, isCrit };
}

function processStatusEffects(arg1, arg2, arg3, arg4) {
    // Style 1: CombatService.js (pHp, mHp, pEffects, mEffects)
    if (typeof arg1 === 'number' && typeof arg2 === 'number') {
        let pHp = arg1;
        let mHp = arg2;
        let pEffects = arg3 || [];
        let mEffects = arg4 || [];
        let log = '';

        pEffects = pEffects.filter(eff => {
            if (eff.duration <= 0) return false;
            if (eff.type === 'BURN') {
                const dmg = Math.floor(pHp * 0.05) || 5;
                pHp = Math.max(0, pHp - dmg);
                log += `🔥 Bạn bị thiêu đốt gây **${dmg}** sát thương.\n`;
            } else if (eff.type === 'POISON') {
                const dmg = eff.damage || 20;
                pHp = Math.max(0, pHp - dmg);
                log += `🐍 Bạn bị trúng độc gây **${dmg}** sát thương.\n`;
            }
            eff.duration--;
            return eff.duration > 0;
        });

        mEffects = mEffects.filter(eff => {
            if (eff.duration <= 0) return false;
            if (eff.type === 'BURN') {
                const dmg = Math.floor(mHp * 0.05) || 5;
                mHp = Math.max(0, mHp - dmg);
                log += `🔥 Quái vật bị thiêu đốt gây **${dmg}** sát thương.\n`;
            } else if (eff.type === 'POISON') {
                const dmg = eff.damage || 20;
                mHp = Math.max(0, mHp - dmg);
                log += `🐍 Quái vật bị trúng độc gây **${dmg}** sát thương.\n`;
            }
            eff.duration--;
            return eff.duration > 0;
        });

        return { playerHP: pHp, monsterHP: mHp, log, effects: mEffects, pEffects };
    }

    // Style 2: PvpService.js / Single Actor ({ hp, max_hp, statusEffects })
    const actor = arg1;
    let damageTaken = 0;
    let log = '';
    let skipTurn = false;

    if (!actor || !actor.statusEffects) return { damageTaken, log, skipTurn };

    actor.statusEffects = actor.statusEffects.filter(effect => {
        if (effect.duration <= 0) return false;

        if (effect.type === 'BURN') {
            const burnDmg = Math.floor(actor.hp * 0.05) || 5;
            damageTaken += burnDmg;
            log += `🔥 **${statusEffects.BURN.name}**: Gây **${burnDmg}** sát thương.\n`;
        } else if (effect.type === 'POISON') {
            const poisonDmg = effect.damage || 20;
            damageTaken += poisonDmg;
            log += `🐍 **${statusEffects.POISON.name}**: Gây **${poisonDmg}** sát thương.\n`;
        } else if (effect.type === 'STUN') {
            skipTurn = true;
            log += `😵 **${statusEffects.STUN.name}**: Bị choáng và mất lượt!\n`;
        }

        effect.duration--;
        return effect.duration > 0;
    });

    return { damageTaken, log, skipTurn };
}

module.exports = {
    elements,
    statusEffects,
    getElementalMultiplier,
    triggerCombatSkills,
    calculateCrit,
    processStatusEffects
};
