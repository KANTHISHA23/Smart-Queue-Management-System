/**
 * Queue repository — raw SQL for queues table and related reads
 */
const { query } = require('../config/db');

const findWithLocationById = (id) =>
  query(
    `SELECT q.*, l.name as location_name, l.type as location_type, l.address as location_address
     FROM queues q
     JOIN locations l ON l.id = q.location_id
     WHERE q.id = $1`,
    [id]
  );

const findByIdForOrganization = (id, organizationId) =>
  query(
    `SELECT * FROM queues WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  );

const findManyByOrganizationId = (organizationId) =>
  query(
    `SELECT * FROM queues WHERE organization_id = $1 ORDER BY created_at DESC`,
    [organizationId]
  );

const findWaitingTokensByQueueId = (queueId) =>
  query(
    `SELECT t.id, t.token_number, t.position, t.priority_level, t.estimated_wait, t.status, t.booked_at,
            COALESCE(u.name, t.guest_name) as user_name,
            q.avg_service_time, q.max_capacity, l.type as location_type,
            (SELECT COUNT(*) FROM tokens t2
             WHERE t2.queue_id = t.queue_id
             AND t2.status = 'waiting'
             AND (
               CASE WHEN t2.priority_level = 'emergency' THEN 1 WHEN t2.priority_level = 'priority' THEN 2 ELSE 3 END
               <
               CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END
               OR (t2.priority_level = t.priority_level AND t2.position < t.position)
             )
            ) as people_ahead
     FROM tokens t
     LEFT JOIN users u ON u.id = t.user_id
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.queue_id = $1 AND t.status IN ('waiting', 'called', 'serving')
     ORDER BY CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END ASC, t.position ASC`,
    [queueId]
  );

const getTodayStatsByQueueId = (queueId) =>
  query(
    `SELECT 
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN status = 'serving' THEN 1 END) as serving_count,
      COUNT(CASE WHEN status IN ('completed', 'skipped') AND DATE(booked_at) = CURRENT_DATE THEN 1 END) as today_served,
      COALESCE(AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND called_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (completed_at - called_at)) / 60.0 END), 0) as avg_service_time
     FROM tokens
     WHERE queue_id = $1 AND DATE(booked_at) = CURRENT_DATE`,
    [queueId]
  );

const insert = (locationId, name, description, prefix, maxCapacity, avgServiceTime) =>
  query(
    `INSERT INTO queues (location_id, name, description, prefix, max_capacity, avg_service_time)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [locationId, name, description, prefix, maxCapacity, avgServiceTime]
  );

const insertForOrganization = (organizationId, locationId, name, description, prefix, maxCapacity, avgServiceTime) =>
  query(
    `INSERT INTO queues (organization_id, location_id, name, description, prefix, max_capacity, avg_service_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [organizationId, locationId, name, description, prefix, maxCapacity, avgServiceTime]
  );

const updateById = (id, name, description, prefix, maxCapacity, avgServiceTime, status) =>
  query(
    `UPDATE queues SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      prefix = COALESCE($3, prefix),
      max_capacity = COALESCE($4, max_capacity),
      avg_service_time = COALESCE($5, avg_service_time),
      status = COALESCE($6, status),
      updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name, description, prefix, maxCapacity, avgServiceTime, status, id]
  );

const updateByIdForOrganization = (organizationId, id, name, description, prefix, maxCapacity, avgServiceTime, status) =>
  query(
    `UPDATE queues SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      prefix = COALESCE($3, prefix),
      max_capacity = COALESCE($4, max_capacity),
      avg_service_time = COALESCE($5, avg_service_time),
      status = COALESCE($6, status),
      updated_at = NOW()
     WHERE id = $7 AND organization_id = $8
     RETURNING *`,
    [name, description, prefix, maxCapacity, avgServiceTime, status, id, organizationId]
  );

const findSummaryById = (id) => query('SELECT id, name FROM queues WHERE id = $1', [id]);

const findSummaryByIdForOrganization = (organizationId, id) =>
  query('SELECT id, name FROM queues WHERE id = $1 AND organization_id = $2', [id, organizationId]);

const deleteById = (id) => query('DELETE FROM queues WHERE id = $1', [id]);

const deleteByIdForOrganization = (organizationId, id) =>
  query('DELETE FROM queues WHERE id = $1 AND organization_id = $2', [id, organizationId]);

const resetCounters = (id) =>
  query(
    `UPDATE queues SET current_number = 0, now_serving = 0, updated_at = NOW() WHERE id = $1`,
    [id]
  );

const resetCountersForOrganization = (organizationId, id) =>
  query(
    `UPDATE queues SET current_number = 0, now_serving = 0, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  );

const cancelWaitingTokensForQueue = (queueId) =>
  query(
    `UPDATE tokens SET status = 'cancelled' WHERE queue_id = $1 AND status IN ('waiting', 'called')`,
    [queueId]
  );

const cancelWaitingTokensForQueueForOrganization = (organizationId, queueId) =>
  query(
    `UPDATE tokens SET status = 'cancelled'
     WHERE queue_id = $1
       AND status IN ('waiting', 'called')
       AND EXISTS (SELECT 1 FROM queues q WHERE q.id = tokens.queue_id AND q.organization_id = $2)`,
    [queueId, organizationId]
  );

// ---------- Admin governance ----------

const findById = (id) =>
  query('SELECT * FROM queues WHERE id = $1', [id]);

const findAllWithOrgAndLocation = () =>
  query(
    `SELECT q.*,
            l.name AS location_name, l.type AS location_type, l.address AS location_address,
            o.name AS organization_name, o.email AS organization_email
     FROM queues q
     LEFT JOIN locations l ON l.id = q.location_id
     LEFT JOIN organizations o ON o.id = q.organization_id
     ORDER BY q.created_at DESC`
  );

const findActiveQueues = () =>
  query(
    `SELECT q.*, l.name AS location_name, l.type AS location_type, l.address AS location_address
     FROM queues q
     LEFT JOIN locations l ON l.id = q.location_id
     WHERE q.status = 'active'
     ORDER BY q.name ASC`
  );

const updateStatusById = (id, status) =>
  query(
    `UPDATE queues SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

module.exports = {
  findWithLocationById,
  findByIdForOrganization,
  findManyByOrganizationId,
  findWaitingTokensByQueueId,
  getTodayStatsByQueueId,
  insert,
  insertForOrganization,
  updateById,
  updateByIdForOrganization,
  findSummaryById,
  findSummaryByIdForOrganization,
  deleteById,
  deleteByIdForOrganization,
  resetCounters,
  resetCountersForOrganization,
  cancelWaitingTokensForQueue,
  cancelWaitingTokensForQueueForOrganization,
  // Admin governance
  findById,
  findAllWithOrgAndLocation,
  findActiveQueues,
  updateStatusById,
};
