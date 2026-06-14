/**
 * Replace Bangalore demo locations with Hazaribagh, Jharkhand data.
 * Run: node src/db/scripts/apply-hazaribagh-locations.js
 */
require('dotenv').config();
const { pool } = require('../../config/db');
const { hazaribaghLocations } = require('../data/hazaribagh-locations');

async function resolveOrgId(client, email, fallbackId) {
  if (!email) return fallbackId;
  const result = await client.query('SELECT id FROM organizations WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0]?.id || fallbackId;
}

async function upsertLocation(client, loc, adminId, existingId = null) {
  const reviewsJson = JSON.stringify(loc.reviews || []);
  const hoursJson = JSON.stringify(loc.operating_hours);

  if (existingId) {
    const updated = await client.query(
      `UPDATE locations SET
         name = $1, type = $2, description = $3, address = $4, city = $5, state = $6,
         zip_code = $7, phone = $8, email = $9, operating_hours = $10, reviews = $11::jsonb,
         is_active = true, updated_at = NOW()
       WHERE id = $12
       RETURNING id, name`,
      [
        loc.name, loc.type, loc.description, loc.address, loc.city, loc.state,
        loc.zip_code, loc.phone, loc.email, hoursJson, reviewsJson, existingId,
      ]
    );
    return updated.rows[0];
  }

  const inserted = await client.query(
    `INSERT INTO locations (
       name, type, description, address, city, state, zip_code, phone, email,
       operating_hours, reviews, admin_id, is_active
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, true)
     RETURNING id, name`,
    [
      loc.name, loc.type, loc.description, loc.address, loc.city, loc.state,
      loc.zip_code, loc.phone, loc.email, hoursJson, reviewsJson, adminId,
    ]
  );
  return inserted.rows[0];
}

async function syncQueues(client, locationId, queues, orgId) {
  const existing = await client.query(
    'SELECT id, name FROM queues WHERE location_id = $1',
    [locationId]
  );
  const existingByName = new Map(existing.rows.map((row) => [row.name, row.id]));
  const desiredNames = new Set(queues.map((q) => q.name));

  for (const queue of queues) {
    if (existingByName.has(queue.name)) continue;
    await client.query(
      `INSERT INTO queues (
         location_id, organization_id, name, description, prefix,
         current_number, now_serving, avg_service_time, status, max_capacity
       ) VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, 100)`,
      [
        locationId,
        orgId,
        queue.name,
        queue.description,
        queue.prefix,
        queue.avg_service_time,
        queue.status || 'active',
      ]
    );
  }

  for (const row of existing.rows) {
    if (!desiredNames.has(row.name)) {
      await client.query('DELETE FROM queues WHERE id = $1', [row.id]);
    }
  }
}

async function apply() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS reviews JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    const adminResult = await client.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
    );
    const adminId = adminResult.rows[0]?.id || null;
    const defaultOrgResult = await client.query(
      "SELECT id FROM organizations WHERE email = 'default@smartqueue.local' LIMIT 1"
    );
    const defaultOrgId = defaultOrgResult.rows[0]?.id || 1;

    const removed = await client.query(`
      DELETE FROM locations
      WHERE city ILIKE 'Bangalore' OR state = 'Karnataka'
      RETURNING id, name
    `);
    console.log(`Removed ${removed.rowCount} Bangalore location(s):`);
    removed.rows.forEach((row) => console.log(`  - ${row.name} (id ${row.id})`));

    const existingRows = await client.query(
      `SELECT id, name FROM locations WHERE city ILIKE 'Hazaribagh' OR name ILIKE '%Hazaribagh%'`
    );
    const existingByKey = {
      'sadar-hospital': existingRows.rows.find((r) => r.name.toLowerCase().includes('sadar hospital'))?.id,
      'civil-court': existingRows.rows.find((r) => r.name.toLowerCase().includes('civil court'))?.id,
    };

    let created = 0;
    let updated = 0;

    for (const loc of hazaribaghLocations) {
      const existingId = existingByKey[loc.key] || null;
      const orgId = await resolveOrgId(client, loc.organizationEmail, defaultOrgId);
      const saved = await upsertLocation(client, loc, adminId, existingId);

      if (existingId) {
        updated += 1;
        console.log(`Updated: ${saved.name} (id ${saved.id})`);
      } else {
        created += 1;
        console.log(`Created: ${saved.name} (id ${saved.id})`);
      }

      await syncQueues(client, saved.id, loc.queues || [], orgId);
    }

    await client.query('COMMIT');

    const summary = await client.query(`
      SELECT type, COUNT(*)::int AS count
      FROM locations
      WHERE city = 'Hazaribagh'
      GROUP BY type
      ORDER BY type
    `);
    const total = await client.query(
      "SELECT COUNT(*)::int AS count FROM locations WHERE city = 'Hazaribagh'"
    );

    console.log('\nHazaribagh locations ready:');
    summary.rows.forEach((row) => console.log(`  ${row.type}: ${row.count}`));
    console.log(`  Total: ${total.rows[0].count}`);
    console.log(`\n(${created} created, ${updated} updated)`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  apply().catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
}

module.exports = { apply };
