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
    createPlayer: async (userId, playerClass = 'Novice') => {
        let hp = 100, mana = 50, attack = 10, defense = 10;
        if (playerClass === 'Novice') { hp = 80; attack = 5; defense = 5; mana = 30; }
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

    // Update player class (Job Change)
    updatePlayerClass: async (userId, newClass) => {
        let hpBonus = 0, attackBonus = 0, defenseBonus = 0, manaBonus = 0;
        // Basic bonuses when picking a class from Novice
        if (newClass === 'Warrior') { hpBonus = 70; attackBonus = 10; defenseBonus = 10; }
        if (newClass === 'Ranger') { hpBonus = 20; attackBonus = 7; defenseBonus = 3; manaBonus = 10; }
        if (newClass === 'Mage') { attackBonus = 15; manaBonus = 70; }
        if (newClass === 'Assassin') { hpBonus = 10; attackBonus = 13; defenseBonus = 2; manaBonus = 10; }

        await pool.execute(
            'UPDATE players SET class = $1, max_hp = max_hp + $2, hp = max_hp + $2, max_mana = max_mana + $3, mana = max_mana + $3 WHERE user_id = $4',
            [newClass, hpBonus, manaBonus, userId]
        );
        await pool.execute(
            'UPDATE player_stats SET attack = attack + $1, defense = defense + $2 WHERE user_id = $3',
            [attackBonus, defenseBonus, userId]
        );
    },

    // Get learned skills
    getPlayerSkills: async (userId) => {
        return await pool.queryAll('SELECT * FROM player_skills WHERE user_id = $1', [userId]);
    }
};
