const db = require('../database');

// In-memory cache: { guildId -> prefix }
const prefixCache = new Map();

const DEFAULT_PREFIX = '.';

/**
 * Lấy prefix của server. Dùng cache để tránh query DB mỗi tin nhắn.
 * @param {string|null} guildId
 * @returns {Promise<string>}
 */
async function getPrefix(guildId) {
    if (!guildId) return DEFAULT_PREFIX;
    if (prefixCache.has(guildId)) return prefixCache.get(guildId);

    try {
        const row = await db.queryOne(
            'SELECT prefix FROM server_config WHERE guild_id = $1',
            [guildId]
        );
        const prefix = row?.prefix ?? DEFAULT_PREFIX;
        prefixCache.set(guildId, prefix);
        return prefix;
    } catch {
        return DEFAULT_PREFIX;
    }
}

/**
 * Đặt prefix mới cho server, lưu vào DB và cập nhật cache.
 * @param {string} guildId
 * @param {string} prefix
 */
async function setPrefix(guildId, prefix) {
    await db.execute(
        `INSERT INTO server_config (guild_id, prefix)
         VALUES ($1, $2)
         ON CONFLICT (guild_id) DO UPDATE SET prefix = $2`,
        [guildId, prefix]
    );
    prefixCache.set(guildId, prefix);
}

module.exports = { getPrefix, setPrefix, DEFAULT_PREFIX };
