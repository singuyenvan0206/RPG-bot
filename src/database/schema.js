const { pool } = require('./pool');

async function initSchema() {
    console.log('[Database] Initializing EchoWorld RPG Schema...');
    
    // Players (Echoes)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            user_id TEXT PRIMARY KEY,
            class TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            exp BIGINT NOT NULL DEFAULT 0,
            hp INTEGER NOT NULL DEFAULT 100,
            max_hp INTEGER NOT NULL DEFAULT 100,
            mana INTEGER NOT NULL DEFAULT 50,
            max_mana INTEGER NOT NULL DEFAULT 50,
            gold BIGINT NOT NULL DEFAULT 0,
            guild_id TEXT DEFAULT NULL,
            current_region TEXT NOT NULL DEFAULT 'whispering_forest',
            last_explore BIGINT DEFAULT 0,
            last_daily BIGINT DEFAULT 0,
            dead_until BIGINT NOT NULL DEFAULT 0,
            last_mine BIGINT DEFAULT 0,
            daily_streak INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()))
        )
    `);

    // Player Equipment (currently equipped)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS player_equipment (
            user_id TEXT PRIMARY KEY REFERENCES players(user_id) ON DELETE CASCADE,
            weapon_id TEXT DEFAULT NULL,
            weapon_upgrade INTEGER NOT NULL DEFAULT 0,
            armor_id TEXT DEFAULT NULL,
            armor_upgrade INTEGER NOT NULL DEFAULT 0,
            accessory_id TEXT DEFAULT NULL,
            accessory_upgrade INTEGER NOT NULL DEFAULT 0,
            pet_id INTEGER DEFAULT NULL
        )
    `);

    // Player Inventory (Items & Materials)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
            item_id TEXT NOT NULL,
            amount INTEGER NOT NULL DEFAULT 1,
            UNIQUE(user_id, item_id)
        )
    `);

    // Player Stats (Derived from level & class & equips, but cached here for ease)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS player_stats (
            user_id TEXT PRIMARY KEY REFERENCES players(user_id) ON DELETE CASCADE,
            attack INTEGER NOT NULL DEFAULT 10,
            defense INTEGER NOT NULL DEFAULT 10,
            agility INTEGER NOT NULL DEFAULT 10,
            crit_rate REAL NOT NULL DEFAULT 0.05,
            crit_damage REAL NOT NULL DEFAULT 1.5
        )
    `);

    // Guilds
    await pool.query(`
        CREATE TABLE IF NOT EXISTS guilds (
            guild_id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            owner_id TEXT NOT NULL REFERENCES players(user_id),
            level INTEGER NOT NULL DEFAULT 1,
            exp BIGINT NOT NULL DEFAULT 0,
            gold BIGINT NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()))
        )
    `);

    // Market / Auction House
    await pool.query(`
        CREATE TABLE IF NOT EXISTS market (
            listing_id SERIAL PRIMARY KEY,
            seller_id TEXT NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
            item_id TEXT NOT NULL,
            amount INTEGER NOT NULL DEFAULT 1,
            price BIGINT NOT NULL,
            created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()))
        )
    `);

    // World States (Global server variables)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS world_states (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);

    // --- EXPANSION TABLES ---

    // Pets
    await pool.query(`
        CREATE TABLE IF NOT EXISTS player_pets (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
            pet_type TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            exp BIGINT NOT NULL DEFAULT 0
        )
    `);

    // Daily Quests
    await pool.query(`
        CREATE TABLE IF NOT EXISTS quests (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            target INTEGER NOT NULL,
            progress INTEGER NOT NULL DEFAULT 0,
            reward_gold BIGINT NOT NULL,
            reward_exp BIGINT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()))
        )
    `);

    // Arena Stats
    await pool.query(`
        CREATE TABLE IF NOT EXISTS arena_stats (
            user_id TEXT PRIMARY KEY REFERENCES players(user_id) ON DELETE CASCADE,
            elo INTEGER NOT NULL DEFAULT 1000,
            wins INTEGER NOT NULL DEFAULT 0,
            losses INTEGER NOT NULL DEFAULT 0
        )
    `);

    // Player Learned Skills
    await pool.query(`
        CREATE TABLE IF NOT EXISTS player_skills (
            user_id TEXT NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
            skill_id TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            equipped_slot INTEGER DEFAULT NULL,
            PRIMARY KEY (user_id, skill_id)
        )
    `);

    // Migration: add equipped_slot column if it doesn't exist
    await pool.query(`
        ALTER TABLE player_skills ADD COLUMN IF NOT EXISTS equipped_slot INTEGER DEFAULT NULL
    `);

    // Migration: add dead_until column if it doesn't exist
    await pool.query(`
        ALTER TABLE players ADD COLUMN IF NOT EXISTS dead_until BIGINT NOT NULL DEFAULT 0
    `);

    // Server Config (prefix per-guild)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS server_config (
            guild_id TEXT PRIMARY KEY,
            prefix TEXT NOT NULL DEFAULT '$'
        )
    `);

    console.log('[Database] EchoWorld RPG Schema initialized successfully.');
}

module.exports = { initSchema };
