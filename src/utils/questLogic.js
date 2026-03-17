const db = require('../database');

async function addProgress(userId, actionType, amount = 1) {
    // Check if the user has any active quests of this type
    const activeQuests = await db.queryAll(
        'SELECT * FROM quests WHERE user_id = $1 AND action_type = $2 AND completed = FALSE',
        [userId, actionType]
    );

    if (activeQuests.length === 0) return;

    for (const q of activeQuests) {
        let newProgress = q.progress + amount;
        if (newProgress >= q.target) {
            newProgress = q.target;
            // Mark as completed - player still needs to /quest claim
        }
        await db.execute('UPDATE quests SET progress = $1 WHERE id = $2', [newProgress, q.id]);
    }
}

async function generateDailyQuests(userId) {
    const templates = [
        { action_type: 'kill_monster', target: 15, gold: 500, exp: 1000 },
        { action_type: 'kill_monster', target: 30, gold: 1200, exp: 2500 },
        { action_type: 'kill_boss', target: 1, gold: 3000, exp: 5000 },
        { action_type: 'earn_gold', target: 5000, gold: 1000, exp: 2000 },
        { action_type: 'explore', target: 20, gold: 400, exp: 800 }
    ];

    // Pick 3 random
    const shuffled = templates.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const q of shuffled) {
        await db.execute(
            'INSERT INTO quests (user_id, action_type, target, reward_gold, reward_exp) VALUES ($1, $2, $3, $4, $5)',
            [userId, q.action_type, q.target, q.gold, q.exp]
        );
    }
}

module.exports = { addProgress, generateDailyQuests };
