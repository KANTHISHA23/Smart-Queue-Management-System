/**
 * Location repository — raw SQL for locations and queue aggregates per location
 */
const { query } = require('../config/db');

const existsById = (id) => query('SELECT id FROM locations WHERE id = $1', [id]);

const countWithFilters = (whereClause, params) =>
  query(`SELECT COUNT(*) AS count FROM locations l ${whereClause}`, params);

const findManyWithQueueStats = (whereClause, paramsWithPaging) =>
  query(
    `SELECT l.*, 
      COUNT(q.id) as queue_count,
      COALESCE(SUM(CASE WHEN q.status = 'active' THEN 1 ELSE 0 END), 0) as active_queues
     FROM locations l
     LEFT JOIN queues q ON q.location_id = l.id
     ${whereClause}
     GROUP BY l.id
     ORDER BY l.created_at DESC
     LIMIT $${paramsWithPaging.length - 1} OFFSET $${paramsWithPaging.length}`,
    paramsWithPaging
  );

const findByIdWithAdmin = (id) =>
  query(
    `SELECT l.*, u.name as admin_name 
     FROM locations l 
     LEFT JOIN users u ON u.id = l.admin_id
     WHERE l.id = $1`,
    [id]
  );

const findQueuesWithStatsByLocationId = (locationId) =>
  query(
    `SELECT q.*,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN t.status = 'serving' THEN 1 END) as serving_count,
      COUNT(CASE WHEN t.status IN ('completed', 'skipped') AND DATE(t.booked_at) = CURRENT_DATE THEN 1 END) as today_served
     FROM queues q
     LEFT JOIN tokens t ON t.queue_id = q.id AND DATE(t.booked_at) = CURRENT_DATE
     WHERE q.location_id = $1 AND q.status = 'active'
     GROUP BY q.id
     ORDER BY q.created_at`,
    [locationId]
  );

const insert = (fields) =>
  query(
    `INSERT INTO locations (name, type, description, address, city, state, zip_code, phone, email, image_url, operating_hours, admin_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      fields.name,
      fields.type,
      fields.description,
      fields.address,
      fields.city,
      fields.state,
      fields.zip_code,
      fields.phone,
      fields.email,
      fields.image_url,
      fields.operating_hours,
      fields.admin_id,
    ]
  );

const updateById = (id, fields) =>
  query(
    `UPDATE locations SET 
      name = COALESCE($1, name),
      type = COALESCE($2, type),
      description = COALESCE($3, description),
      address = COALESCE($4, address),
      city = COALESCE($5, city),
      state = COALESCE($6, state),
      zip_code = COALESCE($7, zip_code),
      phone = COALESCE($8, phone),
      email = COALESCE($9, email),
      image_url = COALESCE($10, image_url),
      operating_hours = COALESCE($11, operating_hours),
      is_active = COALESCE($12, is_active),
      updated_at = NOW()
     WHERE id = $13
     RETURNING *`,
    [
      fields.name,
      fields.type,
      fields.description,
      fields.address,
      fields.city,
      fields.state,
      fields.zip_code,
      fields.phone,
      fields.email,
      fields.image_url,
      fields.operating_hours,
      fields.is_active,
      id,
    ]
  );

const findSummaryById = (id) => query('SELECT id, name FROM locations WHERE id = $1', [id]);

const deleteById = (id) => query('DELETE FROM locations WHERE id = $1', [id]);

module.exports = {
  existsById,
  countWithFilters,
  findManyWithQueueStats,
  findByIdWithAdmin,
  findQueuesWithStatsByLocationId,
  insert,
  updateById,
  findSummaryById,
  deleteById,
};
