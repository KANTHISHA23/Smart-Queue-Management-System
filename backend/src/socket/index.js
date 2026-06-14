/**
 * Socket.io bootstrap — auth middleware, connection lifecycle, modular handlers
 */
const jwt = require('jsonwebtoken');
const { registerQueueSocketHandlers } = require('./queue.socket');
const {
  joinUserNotificationRoom,
  registerNotificationSocketHandlers,
} = require('./notification.socket');

/**
 * @param {import('socket.io').Server} io
 */
const initializeSocket = (io) => {
  const isProd = process.env.NODE_ENV === 'production';
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
      } catch {
        socket.user = null;
      }
    }

    next();
  });

  io.on('connection', (socket) => {
    const label = socket.user ? `(User: ${socket.user.name})` : '(Anonymous)';
    if (!isProd) console.log(`🔌 Socket connected: ${socket.id} ${label}`);

    joinUserNotificationRoom(socket);
    if (socket.user) {
      if (!isProd) console.log(`   → Joined room: user-${socket.user.id}`);
    }

    // Admin: join admin_room for governance events (queue_created, etc.)
    if (socket.user && socket.user.role === 'admin') {
      socket.join('admin_room');
      if (!isProd) console.log(`   → Joined room: admin_room`);
    }

    // Multi-tenant: organizations use an org-scoped room.
    // Services will emit org-specific updates to `org_<organizationId>`.
    if (socket.user && socket.user.role === 'organization' && socket.user.organizationId) {
      socket.join(`org_${socket.user.organizationId}`);
      if (!isProd) console.log(`   → Joined room: org_${socket.user.organizationId}`);
    }

    registerQueueSocketHandlers(socket);
    registerNotificationSocketHandlers(socket);

    socket.on('ping-server', () => {
      socket.emit('pong-server', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      if (!isProd) console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error.message);
    });
  });

  setInterval(() => {
    const n = io.sockets.sockets.size;
    if (!isProd && n > 0) console.log(`📊 Active socket connections: ${n}`);
  }, 60000);

  return io;
};

module.exports = { initializeSocket };
