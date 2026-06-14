/**
 * Notification repository
 */
const { query } = require('../config/db');

const updateUserPushSubscription = (userId, subscriptionJson) =>
  query('UPDATE users SET push_subscription = $1 WHERE id = $2', [subscriptionJson, userId]);

const countWithWhere = (whereClause, params) =>
  query(`SELECT COUNT(*) AS count FROM notifications WHERE ${whereClause}`, params);

const findPageWithWhere = (whereClause, paramsWithPaging) => {
  const n = paramsWithPaging.length;
  return query(
    `SELECT * FROM notifications 
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${n - 1} OFFSET $${n}`,
    paramsWithPaging
  );
};

const countUnreadForUser = (userId) =>
  query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false', [userId]);

const markRead = (id, userId) =>
  query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);

const markAllReadForUser = (userId) =>
  query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [userId]);

module.exports = {
  updateUserPushSubscription,
  countWithWhere,
  findPageWithWhere,
  countUnreadForUser,
  markRead,
  markAllReadForUser,
};
