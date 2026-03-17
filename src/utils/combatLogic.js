const elements = {
    Fire: { beats: 'Wood', emoji: '🔥' },
    Wood: { beats: 'Earth', emoji: '🍃' },
    Earth: { beats: 'Water', emoji: '⛰️' },
    Water: { beats: 'Fire', emoji: '💧' },
    Void: { beats: 'Light', emoji: '🌑' },
    Light: { beats: 'Void', emoji: '✨' }
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
 * @returns {object|null} result { name, effect, multiplier, msg, type, heal_pct, dot_dmg, element }
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
                effect: skill.effect || 'attack',
                multiplier: finalMultiplier,
                element: skill.element || null,
                heal_pct: skill.heal_pct || 0,
                dot_dmg: skill.dot_dmg || 0,
                msg: msg,
                type: skill.type
            };
        }
    }
    return null;
}

module.exports = {
    elements,
    getElementalMultiplier,
    triggerCombatSkills
};
