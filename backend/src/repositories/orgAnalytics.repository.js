/**
 * Organization-scoped analytics — only tokens from queues owned by the provider.
 */
const { query } = require('../config/db');

const ORG_QUEUE_JOIN = `
  JOIN queues q ON q.id = t.queue_id
  WHERE q.organization_id = $1
`;

const getDashboardOverview = async (organizationId) => {
  const today = await query(
    `SELECT
       COUNT(*)::int AS total_tokens,
       COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
       COUNT(*) FILTER (WHERE t.status = 'cancelled')::int AS cancelled,
       COUNT(*) FILTER (WHERE t.status IN ('waiting', 'called', 'serving'))::int AS active,
       COALESCE(ROUND(AVG(
         CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 END
       )::numeric, 0), 0)::int AS avg_wait,
       COALESCE(ROUND(AVG(
         CASE WHEN t.completed_at IS NOT NULL AND t.called_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (t.completed_at - t.called_at)) / 60.0 END
       )::numeric, 0), 0)::int AS avg_service
     FROM tokens t
     ${ORG_QUEUE_JOIN}
       AND DATE(t.booked_at) = CURRENT_DATE`,
    [organizationId]
  );

  const queues = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'active')::int AS active,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive
     FROM queues
     WHERE organization_id = $1`,
    [organizationId]
  );

  const priority = await query(
    `SELECT
       COUNT(*) FILTER (WHERE t.priority_level = 'emergency')::int AS emergency,
       COUNT(*) FILTER (WHERE t.priority_level = 'priority')::int AS priority,
       COUNT(*) FILTER (WHERE t.priority_level = 'normal' OR t.priority_level IS NULL)::int AS normal
     FROM tokens t
     ${ORG_QUEUE_JOIN}
       AND DATE(t.booked_at) = CURRENT_DATE`,
    [organizationId]
  );

  return {
    today: today.rows[0],
    queues: queues.rows[0],
    priority: priority.rows[0],
  };
};

const getDailyStats = async (organizationId, days = 7) => {
  const result = await query(
    `SELECT
       DATE(t.booked_at) AS date,
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
       COUNT(*) FILTER (WHERE t.status = 'cancelled')::int AS cancelled
     FROM tokens t
     ${ORG_QUEUE_JOIN}
       AND t.booked_at >= CURRENT_DATE - ($2::int * INTERVAL '1 day')
     GROUP BY DATE(t.booked_at)
     ORDER BY date ASC`,
    [organizationId, days]
  );
  return result.rows;
};

const getWaitTimesByQueue = async (organizationId) => {
  const result = await query(
    `SELECT
       q.name AS queue_name,
       l.name AS location_name,
       q.status AS queue_status,
       COUNT(t.id)::int AS total_tokens,
       COALESCE(ROUND(AVG(
         CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 END
       )::numeric, 0), 0)::int AS avg_wait_time,
       COALESCE(ROUND(AVG(
         CASE WHEN t.completed_at IS NOT NULL AND t.called_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (t.completed_at - t.called_at)) / 60.0 END
       )::numeric, 0), 0)::int AS avg_service_time,
       COALESCE(ROUND(MAX(
         CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 END
       )::numeric, 0), 0)::int AS max_wait_time
     FROM queues q
     JOIN locations l ON l.id = q.location_id
     LEFT JOIN tokens t ON t.queue_id = q.id AND t.booked_at >= CURRENT_DATE - INTERVAL '30 days'
     WHERE q.organization_id = $1
     GROUP BY q.id, q.name, l.name, q.status
     ORDER BY total_tokens DESC`,
    [organizationId]
  );
  return result.rows;
};

const getHourlyDistribution = async (organizationId) => {
  const result = await query(
    `SELECT
       EXTRACT(HOUR FROM t.booked_at)::int AS hour,
       COUNT(*)::int AS count
     FROM tokens t
     ${ORG_QUEUE_JOIN}
       AND DATE(t.booked_at) = CURRENT_DATE
     GROUP BY EXTRACT(HOUR FROM t.booked_at)
     ORDER BY hour ASC`,
    [organizationId]
  );
  return result.rows;
};

const getBusiestQueues = async (organizationId, limit = 5) => {
  const result = await query(
    `SELECT
       q.id,
       q.name AS queue_name,
       l.name AS location_name,
       q.status,
       COUNT(t.id)::int AS token_count,
       COUNT(*) FILTER (WHERE t.status IN ('waiting', 'called', 'serving'))::int AS active_count
     FROM queues q
     JOIN locations l ON l.id = q.location_id
     LEFT JOIN tokens t ON t.queue_id = q.id AND DATE(t.booked_at) = CURRENT_DATE
     WHERE q.organization_id = $1
     GROUP BY q.id, q.name, l.name, q.status
     ORDER BY token_count DESC
     LIMIT $2`,
    [organizationId, limit]
  );
  return result.rows;
};

const getRecentActivity = async (organizationId, limit = 8) => {
  const result = await query(
    `SELECT
       t.token_number,
       t.status,
       t.priority_level AS priority,
       q.name AS queue_name,
       COALESCE(t.completed_at, t.called_at, t.booked_at) AS updated_at
     FROM tokens t
     ${ORG_QUEUE_JOIN}
     ORDER BY COALESCE(t.completed_at, t.called_at, t.booked_at) DESC
     LIMIT $2`,
    [organizationId, limit]
  );
  return result.rows;
};

const getCompletionRate = async (organizationId, days = 7) => {
  const result = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
       COUNT(*) FILTER (WHERE t.status = 'cancelled')::int AS cancelled
     FROM tokens t
     ${ORG_QUEUE_JOIN}
       AND t.booked_at >= CURRENT_DATE - ($2::int * INTERVAL '1 day')`,
    [organizationId, days]
  );
  return result.rows[0];
};

module.exports = {
  getDashboardOverview,
  getDailyStats,
  getWaitTimesByQueue,
  getHourlyDistribution,
  getBusiestQueues,
  getRecentActivity,
  getCompletionRate,
};
