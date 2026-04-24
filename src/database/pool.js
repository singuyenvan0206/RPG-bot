const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is not defined in .env file!');
    process.exit(1);
}

const connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const url = new URL(process.env.DATABASE_URL);
console.log(`Connecting to database at ${url.protocol}//${url.hostname}:${url.port}${url.pathname}`);

const pool = new Pool(connectionConfig);

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
