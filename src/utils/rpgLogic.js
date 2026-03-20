const db = require('../database');

async function addExp(userId, expGained) {
    return await db.withTransaction(async (client) => {
        const player = await client.query('SELECT * FROM players WHERE user_id = $1', [userId]).then(r => r.rows[0]);
        if (!player) return null;

        let expToMultiply = expGained;
        const globalExpState = await client.query('SELECT value FROM world_states WHERE key = \'global_exp_mult\'').then(r => r.rows[0]);
        const mult = globalExpState ? parseFloat(globalExpState.value) : 1.0;
        expToMultiply = Math.floor(expToMultiply * mult);

        let newExp = Number(player.exp) + expToMultiply;
        let currentLevel = player.level;
        let leveledUp = false;
        let levelsGained = 0;

        let expNeed = 150 + (currentLevel * 100);
        while (newExp >= expNeed) {
            newExp -= expNeed;
            currentLevel++;
            levelsGained++;
            expNeed = 150 + (currentLevel * 100);
            leveledUp = true;
        }

        if (leveledUp) {
            const hpGain = levelsGained * 20;
            const manaGain = levelsGained * 10;
            const statGain = levelsGained * 2;
            
            // Update core stats and fully refill HP/Mana on level up
            await client.query(
                'UPDATE players SET level = $1, exp = $2, max_hp = max_hp + $3, hp = max_hp + $3, max_mana = max_mana + $4, mana = max_mana + $4 WHERE user_id = $5', 
                [currentLevel, newExp, hpGain, manaGain, userId]
            );
            
            await client.query(
                'UPDATE player_stats SET attack = attack + $1, defense = defense + $1 WHERE user_id = $2', 
                [statGain, userId]
            );
        } else {
            await client.query('UPDATE players SET exp = $1 WHERE user_id = $2', [newExp, userId]);
        }

        return { leveledUp, newLevel: currentLevel, levelsGained };
    });
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
