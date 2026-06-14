/**
 * Token repository — raw SQL for tokens, queue counter updates, notifications in transactions
 */

const { query } = require('../config/db');

// ——— Queries using pool `query` ———

const findMyActiveTokens = (userId) =>
  query(
    `SELECT t.*, q.name as queue_name, q.prefix, q.now_serving, q.avg_service_time, q.max_capacity, q.status as queue_status,
            l.name as location_name, l.type as location_type, l.address as location_address,
            (SELECT COUNT(*) FROM tokens t2 
             WHERE t2.queue_id = t.queue_id 
             AND t2.status = 'waiting' 
             AND (
               CASE WHEN t2.priority_level = 'emergency' THEN 1 WHEN t2.priority_level = 'priority' THEN 2 ELSE 3 END 
               < 
               CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END
               OR 
               (
                 t2.priority_level = t.priority_level
                 AND t2.position < t.position
               )
             )
            ) as people_ahead
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.user_id = $1 AND t.status IN ('waiting', 'called', 'serving', 'missed')
     ORDER BY t.booked_at DESC`,
    [userId]
  );

const countTokensByUser = (userId) =>
  query(`SELECT COUNT(*) as count FROM tokens WHERE user_id = $1`, [userId]);

const findHistoryPage = (userId, limit, offset) =>
  query(
    `SELECT t.*, q.name as queue_name, q.prefix,
            l.name as location_name, l.type as location_type
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.user_id = $1
     ORDER BY t.booked_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

const findCancellableByUser = (tokenId, userId) =>
  query(
    `SELECT t.*, q.name as queue_name FROM tokens t JOIN queues q ON q.id = t.queue_id
     WHERE t.id = $1 AND t.user_id = $2 AND t.status IN ('waiting', 'called', 'missed')`,
    [tokenId, userId]
  );

const setTokenCancelled = (tokenId) =>
  query(`UPDATE tokens SET status = 'cancelled', completed_at = NOW() WHERE id = $1`, [tokenId]);

/** Priority-aware count of waiting tokens ahead (matches queue.repository / user-facing queue logic). */
const PEOPLE_AHEAD_SQL = `(SELECT COUNT(*) FROM tokens t2
             WHERE t2.queue_id = t.queue_id
             AND t2.status = 'waiting'
             AND (
               CASE WHEN t2.priority_level = 'emergency' THEN 1 WHEN t2.priority_level = 'priority' THEN 2 ELSE 3 END
               <
               CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END
               OR (t2.priority_level = t.priority_level AND t2.position < t.position)
             )) as people_ahead`;

const findQueueTokensForAdmin = (queueId, status) => {
  let conditions = ['t.queue_id = $1', 'DATE(t.booked_at) = CURRENT_DATE'];
  const params = [queueId];
  if (status) {
    conditions.push('t.status = $2');
    params.push(status);
  }
  return query(
    `SELECT t.*,
            COALESCE(u.name, t.guest_name) as user_name,
            COALESCE(u.phone, t.guest_phone) as user_phone,
            u.email as user_email,
            q.avg_service_time, q.max_capacity, l.type as location_type,
            ${PEOPLE_AHEAD_SQL}
     FROM tokens t
     LEFT JOIN users u ON u.id = t.user_id
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END ASC, t.position ASC`,
    params
  );
};

const findQueueTokensForOrganization = (queueId, organizationId, status) => {
  let conditions = [
    't.queue_id = $1',
    'q.organization_id = $2',
    'DATE(t.booked_at) = CURRENT_DATE',
  ];
  const params = [queueId, organizationId];

  if (status) {
    conditions.push(`t.status = $${params.length + 1}`);
    params.push(status);
  }

  return query(
    `SELECT t.*,
            COALESCE(u.name, t.guest_name) as user_name,
            COALESCE(u.phone, t.guest_phone) as user_phone,
            u.email as user_email,
            q.avg_service_time, q.max_capacity, l.type as location_type,
            ${PEOPLE_AHEAD_SQL}
     FROM tokens t
     LEFT JOIN users u ON u.id = t.user_id
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END ASC, t.position ASC`,
    params
  );
};

// ---------- Organization-scoped ownership helpers ----------

const queueBelongsToOrganization = (queueId, organizationId) =>
  query(`SELECT id FROM queues WHERE id = $1 AND organization_id = $2`, [queueId, organizationId]);

const tokenBelongsToOrganization = (tokenId, organizationId) =>
  query(
    `SELECT t.id, t.queue_id
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     WHERE t.id = $1 AND q.organization_id = $2`,
    [tokenId, organizationId]
  );

const findUsersInOrganizationQueues = (organizationId) =>
  query(
    `SELECT DISTINCT u.id, u.name, u.phone, u.email
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN users u ON u.id = t.user_id
     WHERE q.organization_id = $1 AND t.status IN ('waiting', 'called', 'serving')
     ORDER BY u.name ASC`,
    [organizationId]
  );

const findByIdAndStatus = (tokenId, statuses) => {
  const placeholders = statuses.map((_, i) => `$${i + 2}`).join(', ');
  return query(`SELECT * FROM tokens WHERE id = $1 AND status IN (${placeholders})`, [tokenId, ...statuses]);
};

const findByIdWaiting = (tokenId) =>
  query(`SELECT * FROM tokens WHERE id = $1 AND status = 'waiting'`, [tokenId]);

const updateTokenServing = (tokenId) =>
  query(`UPDATE tokens SET status = 'serving', serving_at = NOW() WHERE id = $1`, [tokenId]);

const updateTokenCompleted = (tokenId) =>
  query(
    `UPDATE tokens SET 
      status = 'completed', 
      completed_at = NOW(),
      service_time = CAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(serving_at, called_at, booked_at))) / 60 AS INTEGER)
     WHERE id = $1`,
    [tokenId]
  );

const updateTokenSkipped = (tokenId) =>
  query(`UPDATE tokens SET status = 'skipped', completed_at = NOW() WHERE id = $1`, [tokenId]);

const updateTokenPriority = (tokenId, priorityLevel, priorityReason) =>
  query(`UPDATE tokens SET priority_level = $1, priority_reason = $2 WHERE id = $3`, [
    priorityLevel,
    priorityReason,
    tokenId,
  ]);

const updateTokenEstimatedWait = (tokenId, estimatedWait, predictionSource) =>
  query(
    `UPDATE tokens SET estimated_wait = $1, prediction_source = $2 WHERE id = $3`,
    [estimatedWait, predictionSource || 'heuristic', tokenId]
  );

const insertSkipNotification = (userId, message) =>
  query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES ($1, 'Token Skipped', $2, 'warning')`,
    [userId, message]
  );

// ——— Client (transaction) methods ———

const countWaitingTokensInQueue = (queueId) =>
  query(
    `SELECT COUNT(*) AS count FROM tokens WHERE queue_id = $1 AND status = 'waiting'`,
    [queueId]
  );

const clientFindActiveQueue = (client, queueId) =>
  client.query('SELECT * FROM queues WHERE id = $1 AND status = $2', [queueId, 'active']);

const clientFindExistingActiveToken = (client, queueId, userId) =>
  client.query(
    `SELECT id FROM tokens WHERE queue_id = $1 AND user_id = $2 AND status IN ('waiting', 'called', 'serving', 'missed')`,
    [queueId, userId]
  );

const clientCountActiveTokensInQueue = (client, queueId) =>
  client.query(
    `SELECT COUNT(*) as count FROM tokens WHERE queue_id = $1 AND status IN ('waiting', 'called', 'serving')`,
    [queueId]
  );

const clientIncrementQueueNumber = (client, queueId) =>
  client.query(
    `UPDATE queues SET current_number = current_number + 1, updated_at = NOW() WHERE id = $1`,
    [queueId]
  );

const clientGetQueueCounter = (client, queueId) =>
  client.query('SELECT current_number, prefix FROM queues WHERE id = $1', [queueId]);

const clientFindExistingActiveGuestToken = (client, queueId, guestPhone) =>
  client.query(
    `SELECT id FROM tokens
     WHERE queue_id = $1 AND guest_phone = $2 AND user_id IS NULL
       AND status IN ('waiting', 'called', 'serving', 'missed')`,
    [queueId, guestPhone]
  );

const clientInsertGuestToken = (
  client,
  tokenNumber,
  queueId,
  guestName,
  guestPhone,
  position,
  estimatedWait,
  notes,
  priorityLevel = 'normal',
  predictionSource = 'heuristic'
) =>
  client.query(
    `INSERT INTO tokens (token_number, queue_id, user_id, guest_name, guest_phone, status, priority_level, position, estimated_wait, notes, prediction_source)
     VALUES ($1, $2, NULL, $3, $4, 'waiting', $8, $5, $6, $7, $9)
     RETURNING *`,
    [tokenNumber, queueId, guestName, guestPhone, position, estimatedWait, notes, priorityLevel, predictionSource]
  );

const clientInsertToken = (client, tokenNumber, queueId, userId, position, estimatedWait, notes, priorityLevel = 'normal', predictionSource = 'heuristic') =>
  client.query(
    `INSERT INTO tokens (token_number, queue_id, user_id, status, priority_level, position, estimated_wait, notes, prediction_source)
     VALUES ($1, $2, $3, 'waiting', $7, $4, $5, $6, $8)
     RETURNING *`,
    [tokenNumber, queueId, userId, position, estimatedWait, notes, priorityLevel, predictionSource]
  );

const clientLocationNameForQueue = (client, queueId) =>
  client.query(
    'SELECT l.name as location_name, l.type as location_type FROM locations l JOIN queues q ON q.location_id = l.id WHERE q.id = $1',
    [queueId]
  );

const clientInsertBookingNotification = (client, userId, title, message, dataJson) =>
  client.query(
    `INSERT INTO notifications (user_id, title, message, type, data)
     VALUES ($1, $2, $3, 'success', $4)`,
    [userId, title, message, dataJson]
  );

const clientFindTokenWaiting = (client, tokenId) =>
  client.query(`SELECT * FROM tokens WHERE id = $1 AND status = 'waiting'`, [tokenId]);

const clientSetTokenCalled = (client, tokenId) =>
  client.query(`UPDATE tokens SET status = 'called', called_at = NOW() WHERE id = $1`, [tokenId]);

const clientUpdateQueueNowServing = (client, position, queueId) =>
  client.query(`UPDATE queues SET now_serving = $1, updated_at = NOW() WHERE id = $2`, [position, queueId]);

const clientInsertTurnNotification = (client, userId, message, dataJson) =>
  client.query(
    `INSERT INTO notifications (user_id, title, message, type, data)
     VALUES ($1, 'Your Turn!', $2, 'turn_called', $3)`,
    [userId, message, dataJson]
  );

const clientFindUpcomingWaiting = (client, queueId, afterPosition) =>
  client.query(
    `SELECT id, user_id, token_number, position FROM tokens 
      WHERE queue_id = $1 AND status = 'waiting' AND position > $2
     ORDER BY CASE WHEN priority_level = 'emergency' THEN 1 WHEN priority_level = 'priority' THEN 2 ELSE 3 END ASC, position ASC LIMIT 3`,
    [queueId, afterPosition]
  );

const clientInsertApproachingNotification = (client, userId, message, dataJson) =>
  client.query(
    `INSERT INTO notifications (user_id, title, message, type, data)
     VALUES ($1, 'Turn Approaching', $2, 'turn_approaching', $3)`,
    [userId, message, dataJson]
  );

const clientCompleteServingInQueue = (client, queueId) =>
  client.query(
    `UPDATE tokens SET 
      status = 'completed', 
      completed_at = NOW(),
      service_time = CAST(EXTRACT(EPOCH FROM (NOW() - COALESCE(serving_at, called_at, booked_at))) / 60 AS INTEGER)
     WHERE queue_id = $1 AND status IN ('called', 'serving')`,
    [queueId]
  );

const clientFindNextWaitingToken = (client, queueId) =>
  client.query(
    `SELECT * FROM tokens 
     WHERE queue_id = $1 AND status = 'waiting'
     ORDER BY CASE WHEN priority_level = 'emergency' THEN 1 WHEN priority_level = 'priority' THEN 2 ELSE 3 END ASC, position ASC 
     LIMIT 1`,
    [queueId]
  );

const getQueueAverageServiceTime = (queueId) =>
  query(
    `SELECT AVG(service_time) as avg_service_time 
     FROM (
       SELECT service_time FROM tokens 
       WHERE queue_id = $1 AND status = 'completed' AND service_time IS NOT NULL AND service_time > 0
       ORDER BY completed_at DESC LIMIT 20
     )`,
    [queueId]
  );

const findUnnotifiedWaitingTokens = (queueId) =>
  query(
    `SELECT t.id, t.user_id, t.token_number, t.queue_id, t.position, t.priority_level,
            q.avg_service_time, q.max_capacity, l.type as location_type,
     (SELECT COUNT(*) FROM tokens t2 
         WHERE t2.queue_id = t.queue_id 
         AND t2.status = 'waiting' 
         AND (
           CASE WHEN t2.priority_level = 'emergency' THEN 1 WHEN t2.priority_level = 'priority' THEN 2 ELSE 3 END 
           < 
           CASE WHEN t.priority_level = 'emergency' THEN 1 WHEN t.priority_level = 'priority' THEN 2 ELSE 3 END
           OR 
           (
             t2.priority_level = t.priority_level
             AND t2.position < t.position
           )
         )
     ) as people_ahead
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.queue_id = $1 AND t.status = 'waiting' AND (t.notified = false OR t.notified IS NULL)`,
    [queueId]
  );

const markTokensNotified = (tokenIds) => {
  if (tokenIds.length === 0) return Promise.resolve();
  const placeholders = tokenIds.map((_, i) => `$${i + 1}`).join(', ');
  return query(`UPDATE tokens SET notified = true WHERE id IN (${placeholders})`, tokenIds);
};

const clientFindTokenById = (client, tokenId) =>
  client.query(`SELECT * FROM tokens WHERE id = $1`, [tokenId]);

const clientUpdateTokenMissed = (client, tokenId) =>
  client.query(`UPDATE tokens SET status = 'missed', completed_at = NOW() WHERE id = $1`, [tokenId]);

const clientGetMaxPosition = (client, queueId) =>
  client.query(`SELECT COALESCE(MAX(position), 0) as max_position FROM tokens WHERE queue_id = $1`, [queueId]);

const clientRecoverRejoin = (client, tokenId, newPosition) =>
  client.query(`UPDATE tokens SET status = 'waiting', position = $1, recovery_attempts = recovery_attempts + 1, completed_at = NULL WHERE id = $2`, [newPosition, tokenId]);

const clientRecoverRecall = (client, tokenId) =>
  client.query(`UPDATE tokens SET status = 'waiting', recovery_attempts = recovery_attempts + 1, completed_at = NULL WHERE id = $1`, [tokenId]);

module.exports = {
  findMyActiveTokens,
  countTokensByUser,
  findHistoryPage,
  findCancellableByUser,
  setTokenCancelled,
  findQueueTokensForAdmin,
  findQueueTokensForOrganization,
  queueBelongsToOrganization,
  tokenBelongsToOrganization,
  findUsersInOrganizationQueues,
  findByIdAndStatus,
  findByIdWaiting,
  updateTokenServing,
  updateTokenCompleted,
  updateTokenSkipped,
  updateTokenPriority,
  updateTokenEstimatedWait,
  insertSkipNotification,
  clientFindActiveQueue,
  clientFindExistingActiveToken,
  clientFindExistingActiveGuestToken,
  clientCountActiveTokensInQueue,
  clientIncrementQueueNumber,
  clientGetQueueCounter,
  clientInsertToken,
  clientInsertGuestToken,
  clientLocationNameForQueue,
  clientInsertBookingNotification,
  clientFindTokenWaiting,
  clientSetTokenCalled,
  clientUpdateQueueNowServing,
  clientInsertTurnNotification,
  clientFindUpcomingWaiting,
  clientInsertApproachingNotification,
  clientCompleteServingInQueue,
  clientFindNextWaitingToken,
  getQueueAverageServiceTime,
  countWaitingTokensInQueue,
  findUnnotifiedWaitingTokens,
  markTokensNotified,
  clientFindTokenById,
  clientUpdateTokenMissed,
  clientGetMaxPosition,
  clientRecoverRejoin,
  clientRecoverRecall,
};
