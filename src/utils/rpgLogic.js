const db = require('../database');

async function addExp(userId, expGained, client = null) {
    const logic = async (txClient) => {
        const player = await txClient.query('SELECT * FROM players WHERE user_id = $1', [userId]).then(r => r.rows[0]);
        if (!player) return null;

        let expToMultiply = expGained;
        const globalExpState = await txClient.query('SELECT value FROM world_states WHERE key = \'global_exp_mult\'').then(r => r.rows[0]);
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
            
            await txClient.query(
                'UPDATE players SET level = $1, exp = $2, max_hp = max_hp + $3, hp = max_hp + $3, max_mana = max_mana + $4, mana = max_mana + $4 WHERE user_id = $5', 
                [currentLevel, newExp, hpGain, manaGain, userId]
            );
            
            await txClient.query(
                'UPDATE player_stats SET attack = attack + $1, defense = defense + $1 WHERE user_id = $2', 
                [statGain, userId]
            );
        } else {
            await txClient.query('UPDATE players SET exp = $1 WHERE user_id = $2', [newExp, userId]);
        }

        return { leveledUp, newLevel: currentLevel, levelsGained };
    };

    if (client) return await logic(client);
    return await db.withTransaction(logic);
}

async function addGuildExp(guildId, amount, client = null) {
    if (!guildId) return null;
    const dbObj = client || db;
    
    // Support both client.query and db.queryOne
    const guild = await (client ? client.query('SELECT * FROM rpg_guilds WHERE guild_id = $1', [guildId]).then(r => r.rows[0]) : db.queryOne('SELECT * FROM rpg_guilds WHERE guild_id = $1', [guildId]));
    if (!guild) return null;

    let newExp = Number(guild.exp) + amount;
    let currentLevel = guild.level;
    let leveledUp = false;

    let expNeed = currentLevel * 5000;
    while (newExp >= expNeed) {
        newExp -= expNeed;
        currentLevel++;
        expNeed = currentLevel * 5000;
        leveledUp = true;
    }

    const query = 'UPDATE rpg_guilds SET exp = $1, level = $2 WHERE guild_id = $3';
    const params = [newExp, currentLevel, guildId];
    
    if (client) await client.query(query, params);
    else await db.execute(query, params);
    
    return { leveledUp, newLevel: currentLevel };
}

module.exports = { addExp, addGuildExp };
