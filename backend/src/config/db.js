/**
 * Database Configuration — Neon PostgreSQL via `pg`
 */
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error('DATABASE_URL is required. Set your Neon PostgreSQL connection string in backend/.env.');
}

const connectionUrl = new URL(rawConnectionString);
if (connectionUrl.searchParams.get('sslmode') === 'require' && !connectionUrl.searchParams.has('uselibpqcompat')) {
  connectionUrl.searchParams.set('uselibpqcompat', 'true');
}

const connectionString = connectionUrl.toString();

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '10000', 10),
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error.message);
});

async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('PostgreSQL query error:', error.message);
    console.error('SQL:', text.substring(0, 200));
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  let inTransaction = false;

  return {
    query: async (text, params) => {
      if (text === 'BEGIN') inTransaction = true;
      if (text === 'COMMIT' || text === 'ROLLBACK') inTransaction = false;
      return client.query(text, params);
    },
    release: async () => {
      if (inTransaction) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // Ignore cleanup rollback errors.
        }
      }
      client.release();
    },
  };
}

const getDb = () => pool;

module.exports = {
  query,
  getClient,
  getDb,
  pool,
};
