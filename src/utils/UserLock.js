const locks = new Map();

/**
 * Simple in-memory locking system to prevent race conditions 
 * from rapid button clicks or concurrent commands for the same user.
 * Included automatic timeout for safety.
 */
class UserLock {
    /**
     * Attempts to acquire a lock for a user.
     * @param {string} userId
     * @param {number} timeoutMs (default 5000ms)
     * @returns {boolean} True if lock acquired, false if already locked.
     */
    static acquire(userId, timeoutMs = 5000) {
        const now = Date.now();
        
        // Check if existing lock is expired
        if (locks.has(userId)) {
            const expiry = locks.get(userId);
            if (now < expiry) {
                return false;
            }
        }
        
        locks.set(userId, now + timeoutMs);
        return true;
    }

    /**
     * Releases the lock for a user.
     * @param {string} userId
     */
    static release(userId) {
        locks.delete(userId);
    }
}

module.exports = UserLock;
