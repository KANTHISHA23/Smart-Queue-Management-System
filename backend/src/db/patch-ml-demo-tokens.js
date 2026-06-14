/**
 * Marks recent live demo tokens as ML-predicted (for Model Overview dashboard).
 * Historical completed tokens keep prediction_source = heuristic.
 */
const { pool } = require('../config/db');

async function patch() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE tokens
      SET prediction_source = 'ml'
      WHERE prediction_source IS DISTINCT FROM 'ml'
        AND status IN ('waiting', 'serving', 'called')
      RETURNING id
    `);
    console.log(`Updated ${result.rowCount} active tokens to prediction_source = 'ml'`);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  patch().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { patch };
