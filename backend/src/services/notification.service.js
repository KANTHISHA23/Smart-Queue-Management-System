/**
 * Notification service
 */
const notificationRepository = require('../repositories/notification.repository');

async function subscribe(userId, subscription) {
  await notificationRepository.updateUserPushSubscription(userId, JSON.stringify(subscription));
  return { ok: true, message: 'Subscribed to push notifications.' };
}

async function getNotifications(userId, queryParams) {
  const { page = 1, limit = 20, unread_only } = queryParams;
  const offset = (page - 1) * limit;

  const conditions = ['user_id = $1'];
  const params = [userId];

  if (unread_only === 'true') {
    conditions.push('is_read = false');
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await notificationRepository.countWithWhere(whereClause, params);
  const paramsWithPaging = [...params, parseInt(limit, 10), parseInt(offset, 10)];
  const result = await notificationRepository.findPageWithWhere(whereClause, paramsWithPaging);

  const unreadResult = await notificationRepository.countUnreadForUser(userId);
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    ok: true,
    data: {
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count, 10),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

async function markAsRead(userId, id) {
  await notificationRepository.markRead(id, userId);
  return { ok: true, message: 'Notification marked as read.' };
}

async function markAllAsRead(userId) {
  await notificationRepository.markAllReadForUser(userId);
  return { ok: true, message: 'All notifications marked as read.' };
}

module.exports = {
  subscribe,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
