/**
 * Database Migration Runner — PostgreSQL / Neon version
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const executedResult = await client.query('SELECT name FROM migrations ORDER BY name');
    const executedNames = new Set(executedResult.rows.map((row) => row.name));

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let migrationsRun = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  Skipping ${file} (already executed)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`  Running ${file}...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ${file} completed successfully`);
        migrationsRun++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ${file} failed:`, error.message);
        throw error;
      }
    }

    if (migrationsRun === 0) {
      console.log('\nAll migrations are up to date.');
    } else {
      console.log(`\nSuccessfully ran ${migrationsRun} migration(s).`);
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      await pool.end();
    })
    .catch(async (error) => {
      console.error('\nMigration failed:', error.message);
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  runMigrations,
};
