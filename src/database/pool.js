const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
}

async function queryOne(text, params) {
    const res = await query(text, params);
    return res.rows[0];
}

async function queryAll(text, params) {
    const res = await query(text, params);
    return res.rows;
}

async function execute(text, params) {
    const res = await query(text, params);
    return res.rowCount;
}

async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    query,
    queryOne,
    queryAll,
    execute,
    withTransaction
};
