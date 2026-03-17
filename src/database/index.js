const pool = require('./pool');
const schema = require('./schema');

module.exports = {
    ...pool,
    ...schema,
    
    // Check if player exists
    getPlayer: async (userId) => {
        return await pool.queryOne('SELECT * FROM players WHERE user_id = $1', [userId]);
    },

    // Create a new player
    createPlayer: async (userId, playerClass) => {
        let hp = 100, mana = 50, attack = 10, defense = 10;
        if (playerClass === 'Warrior') { hp = 150; attack = 15; defense = 15; mana = 30; }
        if (playerClass === 'Ranger') { hp = 100; attack = 12; defense = 8; mana = 40; }
        if (playerClass === 'Mage') { hp = 80; attack = 20; defense = 5; mana = 100; }
        if (playerClass === 'Assassin') { hp = 90; attack = 18; defense = 7; mana = 40; }

        await pool.execute(
            'INSERT INTO players (user_id, class, hp, max_hp, mana, max_mana) VALUES ($1, $2, $3, $3, $4, $4)', 
            [userId, playerClass, hp, mana]
        );
        
        await pool.execute(
            'INSERT INTO player_stats (user_id, attack, defense) VALUES ($1, $2, $3)', 
            [userId, attack, defense]
        );
    },

    // Get learned skills
    getPlayerSkills: async (userId) => {
        return await pool.queryAll('SELECT * FROM player_skills WHERE user_id = $1', [userId]);
    }
};
