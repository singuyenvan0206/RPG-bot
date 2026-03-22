const sessions = new Map();

/**
 * Exploration Session Manager
 */
module.exports = {
    /**
     * Creates or retrieves a session for a user.
     * @param {string} userId 
     * @param {object} initialData { region, hp, max_hp, statusEffects }
     */
    getOrCreateSession(userId, initialData) {
        if (!sessions.has(userId)) {
            sessions.set(userId, {
                userId,
                region: initialData.region,
                hp: initialData.hp,
                maxHp: initialData.maxHp,
                statusEffects: initialData.statusEffects || [],
                progress: 0,
                accumulatedRewards: { gold: 0, exp: 0, items: [] },
                monster: null, // { id, hp, maxHp, statusEffects, isShiny }
                petId: initialData.petId || null,
                lastAction: Date.now()
            });
        }
        return sessions.get(userId);
    },

    getSession(userId) {
        return sessions.get(userId);
    },

    updateSession(userId, data) {
        const session = sessions.get(userId);
        if (session) {
            Object.assign(session, data);
            session.lastAction = Date.now();
        }
        return session;
    },

    endSession(userId) {
        sessions.delete(userId);
    },

    /**
     * Cleanup old sessions (e.g., > 30 mins)
     */
    cleanup() {
        const now = Date.now();
        for (const [userId, session] of sessions.entries()) {
            if (now - session.lastAction > 1800000) { // 30 mins
                sessions.delete(userId);
            }
        }
    }
};
