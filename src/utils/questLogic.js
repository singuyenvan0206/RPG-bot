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
        let completed = q.completed;
        if (newProgress >= q.target) {
            newProgress = q.target;
            completed = true;
        }
        await db.execute('UPDATE quests SET progress = $1, completed = $2 WHERE id = $3', [newProgress, completed, q.id]);
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

    const shuffled = templates.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const q of shuffled) {
        await db.execute(
            'INSERT INTO quests (user_id, action_type, target, reward_gold, reward_exp, quest_type) VALUES ($1, $2, $3, $4, $5, \'daily\')',
            [userId, q.action_type, q.target, q.gold, q.exp]
        );
    }
}

async function generateWeeklyQuests(userId) {
    const templates = [
        { action_type: 'kill_monster', target: 200, gold: 10000, exp: 20000 },
        { action_type: 'kill_boss', target: 5, gold: 25000, exp: 50000 },
        { action_type: 'earn_gold', target: 100000, gold: 20000, exp: 40000 },
        { action_type: 'explore', target: 150, gold: 8000, exp: 16000 }
    ];

    const shuffled = templates.sort(() => 0.5 - Math.random()).slice(0, 2);
    for (const q of shuffled) {
        await db.execute(
            'INSERT INTO quests (user_id, action_type, target, reward_gold, reward_exp, quest_type) VALUES ($1, $2, $3, $4, $5, \'weekly\')',
            [userId, q.action_type, q.target, q.gold, q.exp]
        );
    }
}

async function claimQuest(userId, questId) {
    const quest = await db.queryOne('SELECT * FROM quests WHERE id = $1 AND user_id = $2', [questId, userId]);
    if (!quest || !quest.completed || quest.is_claimed) return { success: false, message: 'Nhiệm vụ chưa xong hoặc đã nhận thưởng!' };

    await db.execute('UPDATE quests SET is_claimed = TRUE WHERE id = $1', [questId]);
    await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [quest.reward_gold, userId]);
    const rpgLogic = require('./rpgLogic');
    await rpgLogic.addExp(userId, Number(quest.reward_exp));

    return { success: true, gold: quest.reward_gold, exp: quest.reward_exp };
}

module.exports = { addProgress, generateDailyQuests, generateWeeklyQuests, claimQuest };
