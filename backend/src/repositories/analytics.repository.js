/**
 * Analytics repository — reporting queries
 */
const { query } = require('../config/db');

const getTodayTokenStats = () =>
  query(`
    SELECT 
      COUNT(*) as total_tokens_today,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_today,
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_now,
      COUNT(CASE WHEN status IN ('called', 'serving') THEN 1 END) as serving_now,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_today,
      COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_today,
      COALESCE(ROUND(AVG(
        CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND called_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (completed_at - called_at)) / 60.0 END
      )::numeric, 1), 0) as avg_service_time,
      COALESCE(ROUND(AVG(
        CASE WHEN status = 'completed' AND called_at IS NOT NULL AND booked_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (called_at - booked_at)) / 60.0 END
      )::numeric, 1), 0) as avg_wait_time
    FROM tokens
    WHERE DATE(booked_at) = CURRENT_DATE
  `);

const countActiveQueues = () => query(`SELECT COUNT(*) as count FROM queues WHERE status = 'active'`);

const countActiveLocations = () => query(`SELECT COUNT(*) as count FROM locations WHERE is_active = true`);

const countUsers = () => query(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);

const getBusiestQueuesToday = () =>
  query(`
    SELECT q.id, q.name, l.name as location_name,
      COUNT(t.id) as token_count,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count
    FROM queues q
    JOIN locations l ON l.id = q.location_id
    LEFT JOIN tokens t ON t.queue_id = q.id AND DATE(t.booked_at) = CURRENT_DATE
    WHERE q.status = 'active'
    GROUP BY q.id, q.name, l.name
    ORDER BY token_count DESC
    LIMIT 5
  `);

const getRecentActivityToday = () =>
  query(`
    SELECT t.token_number, t.status, t.booked_at, t.called_at, t.completed_at,
           u.name as user_name, q.name as queue_name
    FROM tokens t
    JOIN users u ON u.id = t.user_id
    JOIN queues q ON q.id = t.queue_id
    WHERE DATE(t.booked_at) = CURRENT_DATE
    ORDER BY t.booked_at DESC
    LIMIT 10
  `);

const getDailyStats = (days) =>
  query(
    `
    SELECT 
      date(booked_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped,
      COALESCE(ROUND(AVG(
        CASE WHEN status = 'completed' AND called_at IS NOT NULL AND booked_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (called_at - booked_at)) / 60.0 END
      )::numeric, 1), 0) as avg_wait_time
    FROM tokens
    WHERE booked_at >= CURRENT_DATE - ($1::int * INTERVAL '1 day')
    GROUP BY DATE(booked_at)
    ORDER BY date DESC
  `,
    [days]
  );

const getWaitTimeStats = () =>
  query(`
    SELECT q.id, q.name as queue_name, l.name as location_name,
      COUNT(t.id) as total_tokens,
      COALESCE(ROUND(AVG(
        CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 END
      )::numeric, 1), 0) as avg_wait_time,
      COALESCE(ROUND(AVG(
        CASE WHEN t.status = 'completed' AND t.completed_at IS NOT NULL AND t.called_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.completed_at - t.called_at)) / 60.0 END
      )::numeric, 1), 0) as avg_service_time,
      COALESCE(MAX(
        CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.called_at - t.booked_at)) / 60.0 END
      ), 0) as max_wait_time
    FROM queues q
    JOIN locations l ON l.id = q.location_id
    LEFT JOIN tokens t ON t.queue_id = q.id AND t.booked_at >= NOW() - INTERVAL '7 days'
    GROUP BY q.id, q.name, l.name
    ORDER BY avg_wait_time DESC
  `);

const getHourlyStatsToday = () =>
  query(`
    SELECT 
      EXTRACT(HOUR FROM booked_at)::int as hour,
      COUNT(*) as count
    FROM tokens
    WHERE DATE(booked_at) = CURRENT_DATE
    GROUP BY EXTRACT(HOUR FROM booked_at)
    ORDER BY hour
  `);

const getMlProductionStats = () =>
  query(`
    SELECT
      COALESCE(prediction_source, 'heuristic') AS prediction_source,
      COUNT(*)::int AS count
    FROM tokens
    GROUP BY COALESCE(prediction_source, 'heuristic')
  `);

const getMlProductionAccuracy = () =>
  query(`
    SELECT
      COALESCE(prediction_source, 'heuristic') AS prediction_source,
      COUNT(*)::int AS completed_with_estimate,
      COALESCE(ROUND(AVG(ABS(estimated_wait - actual_wait_minutes))::numeric, 2), 0) AS mae_minutes,
      COALESCE(ROUND(
        100.0 * COUNT(CASE WHEN ABS(estimated_wait - actual_wait_minutes) <= 5 THEN 1 END)
        / NULLIF(COUNT(*), 0)
      , 1), 0) AS within_5_pct
    FROM (
      SELECT
        prediction_source,
        estimated_wait,
        EXTRACT(EPOCH FROM (called_at - booked_at)) / 60.0 AS actual_wait_minutes
      FROM tokens
      WHERE status = 'completed'
        AND called_at IS NOT NULL
        AND booked_at IS NOT NULL
        AND estimated_wait IS NOT NULL
    ) completed
    GROUP BY COALESCE(prediction_source, 'heuristic')
  `);

module.exports = {
  getTodayTokenStats,
  countActiveQueues,
  countActiveLocations,
  countUsers,
  getBusiestQueuesToday,
  getRecentActivityToday,
  getDailyStats,
  getWaitTimeStats,
  getHourlyStatsToday,
  getMlProductionStats,
  getMlProductionAccuracy,
};
