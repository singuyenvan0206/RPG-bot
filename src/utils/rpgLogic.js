const db = require('../database');

async function addExp(userId, expGained) {
    const player = await db.getPlayer(userId);
    if (!player) return null;

    let newExp = Number(player.exp) + expGained;
    let currentLevel = player.level;
    let leveledUp = false;
    let levelsGained = 0;

    // Level up loop
    let expNeed = currentLevel * 100;
    while (newExp >= expNeed) {
        newExp -= expNeed;
        currentLevel++;
        levelsGained++;
        expNeed = currentLevel * 100;
        leveledUp = true;
    }

    if (leveledUp) {
        // Increase max_hp, max_mana
        const hpGain = levelsGained * 20;
        const manaGain = levelsGained * 10;
        
        await db.execute(
            'UPDATE players SET level = $1, exp = $2, max_hp = max_hp + $3, hp = max_hp + $3, max_mana = max_mana + $4, mana = max_mana + $4 WHERE user_id = $5', 
            [currentLevel, newExp, hpGain, manaGain, userId]
        );
        
        // Stat scaling per level
        const statGain = levelsGained * 2;
        await db.execute(
            'UPDATE player_stats SET attack = attack + $1, defense = defense + $1 WHERE user_id = $2', 
            [statGain, userId]
        );
    } else {
        await db.execute('UPDATE players SET exp = $1 WHERE user_id = $2', [newExp, userId]);
    }

    return { leveledUp, newLevel: currentLevel, levelsGained };
}

async function addGuildExp(guildId, amount) {
    if (!guildId) return null;
    const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [guildId]);
    if (!guild) return null;

    let newExp = Number(guild.exp) + amount;
    let currentLevel = guild.level;
    let leveledUp = false;

    // Cần level * 5000 EXP để thăng cấp Bang
    let expNeed = currentLevel * 5000;
    while (newExp >= expNeed) {
        newExp -= expNeed;
        currentLevel++;
        expNeed = currentLevel * 5000;
        leveledUp = true;
    }

    await db.execute('UPDATE guilds SET exp = $1, level = $2 WHERE guild_id = $3', [newExp, currentLevel, guildId]);
    
    return { leveledUp, newLevel: currentLevel };
}

module.exports = { addExp, addGuildExp };
