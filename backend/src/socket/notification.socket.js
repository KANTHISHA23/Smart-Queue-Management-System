/**
 * Notification-related Socket.io: admin rooms, user-targeted emits, connection setup
 */

/**
 * Join personal notification room when JWT user is present
 * @param {import('socket.io').Socket} socket
 */
function joinUserNotificationRoom(socket) {
  if (socket.user) {
    socket.join(`user-${socket.user.id}`);
  }
}

/**
 * Register admin / notification channel handlers
 * @param {import('socket.io').Socket} socket
 */
function registerNotificationSocketHandlers(socket) {
  socket.on('join-admin', (data) => {
    if (socket.user && socket.user.role === 'admin') {
      const { locationId } = data || {};
      if (locationId) {
        socket.join(`admin-location-${locationId}`);
      }
      socket.join('admin-room');
    }
  });
}

/**
 * Emit direct “your turn” to a user’s room
 * @param {import('socket.io').Server | null} io
 */
function emitYourTurn(io, userId, payload) {
  if (!io) return;
  io.to(`user-${userId}`).emit('your-turn', payload);
}

/**
 * Emit pre-call notification indicating turn is near
 * @param {import('socket.io').Server | null} io
 */
function emitPreCallNotification(io, userId, payload) {
  if (!io) return;
  io.to(`user-${userId}`).emit('pre_call_notification', payload);
}

module.exports = {
  joinUserNotificationRoom,
  registerNotificationSocketHandlers,
  emitYourTurn,
  emitPreCallNotification,
};
