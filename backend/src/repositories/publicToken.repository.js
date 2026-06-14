/**
 * Public token tracking repository.
 * Contains read-only queries for anonymous token status lookups.
 */
const { query } = require('../config/db');

const findTrackableTokenByIdentifier = (tokenIdentifier) =>
  query(
    `SELECT
        t.id,
        t.token_number,
        t.status,
        t.queue_id,
        t.position,
        t.priority_level,
        q.name AS queue_name,
        q.avg_service_time,
        q.max_capacity,
        q.status AS queue_status,
        l.type AS location_type,
        COALESCE(
          (
            SELECT ts.token_number
            FROM tokens ts
            WHERE ts.queue_id = t.queue_id AND ts.status = 'serving'
            ORDER BY
              CASE
                WHEN ts.priority_level = 'emergency' THEN 1
                WHEN ts.priority_level = 'priority' THEN 2
                ELSE 3
              END ASC,
              ts.position ASC
            LIMIT 1
          ),
          (
            SELECT ts.token_number
            FROM tokens ts
            WHERE ts.queue_id = t.queue_id AND ts.status = 'called'
            ORDER BY
              CASE
                WHEN ts.priority_level = 'emergency' THEN 1
                WHEN ts.priority_level = 'priority' THEN 2
                ELSE 3
              END ASC,
              ts.position ASC
            LIMIT 1
          )
        ) AS current_serving_token
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE CAST(t.id AS TEXT) = $1 OR LOWER(t.token_number) = LOWER($1)
     LIMIT 1`,
    [tokenIdentifier]
  );

const countWaitingAhead = (queueId, position, priorityLevel) =>
  query(
    `SELECT COUNT(*) AS count
     FROM tokens
     WHERE queue_id = $1
       AND status = 'waiting'
       AND (
         CASE
           WHEN priority_level = 'emergency' THEN 1
           WHEN priority_level = 'priority' THEN 2
           ELSE 3
         END
         <
         CASE
           WHEN $3 = 'emergency' THEN 1
           WHEN $3 = 'priority' THEN 2
           ELSE 3
         END
         OR (priority_level = $3 AND position < $2)
       )`,
    [queueId, position, priorityLevel || 'normal']
  );

module.exports = {
  findTrackableTokenByIdentifier,
  countWaitingAhead,
};
