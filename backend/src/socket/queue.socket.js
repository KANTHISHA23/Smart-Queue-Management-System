/**
 * Queue-related Socket.io handlers and server-side emits to queue rooms
 */

/**
 * Register queue room join/leave handlers on a connected socket
 * @param {import('socket.io').Socket} socket
 */
function registerQueueSocketHandlers(socket) {
  socket.on('join-queue', (data) => {
    const { queueId } = data || {};
    if (queueId) {
      socket.join(`queue-${queueId}`);
      socket.emit('joined-queue', {
        queueId,
        message: `Connected to queue ${queueId} updates`,
      });
    }
  });

  socket.on('leave-queue', (data) => {
    const { queueId } = data || {};
    if (queueId) {
      socket.leave(`queue-${queueId}`);
    }
  });
}

/**
 * Emit generic queue room update (new token, cancelled, completed, etc.)
 * @param {import('socket.io').Server | null} io
 * @param {number|string} queueId
 * @param {object} payload — spread as event body (type, queueId, token, …)
 */
function emitQueueUpdate(io, queueId, payload) {
  if (!io) return;
  io.to(`queue-${queueId}`).emit('queue-update', payload);
}

/**
 * Emit an update scoped to an organization room.
 * Event name is `org-queue-update` so org dashboards can listen without joining queue rooms.
 * @param {import('socket.io').Server | null} io
 * @param {number|string} organizationId
 * @param {object} payload
 */
function emitOrgQueueUpdate(io, organizationId, payload) {
  if (!io || !organizationId) return;
  io.to(`org_${organizationId}`).emit('org-queue-update', payload);
}

/**
 * Emit token-called to queue subscribers
 * @param {import('socket.io').Server | null} io
 */
function emitTokenCalledToQueue(io, queueId, tokenPayload) {
  if (!io) return;
  io.to(`queue-${queueId}`).emit('token-called', {
    queueId: typeof queueId === 'string' ? parseInt(queueId, 10) : queueId,
    token: tokenPayload,
  });
}

// ---------- Governance events (3-actor system) ----------

/**
 * Emit when provider creates a new queue.
 * Admin room receives this so admin can see newly pending queues.
 * @param {import('socket.io').Server | null} io
 * @param {object} queueData
 */
function emitQueueCreated(io, queueData) {
  if (!io) return;
  io.to('admin_room').emit('queue_created', {
    type: 'queue_created',
    queue: queueData,
  });
  // Also notify the provider's org room
  if (queueData?.organization_id) {
    io.to(`org_${queueData.organization_id}`).emit('org-queue-update', {
      type: 'queue_created',
      queue: queueData,
    });
  }
}

/**
 * Emit when admin activates a queue.
 * ALL connected clients receive this so users see the new active queue.
 * @param {import('socket.io').Server | null} io
 * @param {object} queueData
 */
function emitQueueActivated(io, queueData) {
  if (!io) return;
  // Broadcast to everyone
  io.emit('queue_activated', {
    type: 'queue_activated',
    queue: queueData,
  });
}

/**
 * Emit when admin deactivates a queue.
 * ALL connected clients receive this so users remove the queue from view.
 * @param {import('socket.io').Server | null} io
 * @param {object} queueData
 */
function emitQueueDeactivated(io, queueData) {
  if (!io) return;
  io.emit('queue_deactivated', {
    type: 'queue_deactivated',
    queue: queueData,
  });
}

/**
 * Emit when a queue is deleted.
 * Admin room + org room receive this.
 * @param {import('socket.io').Server | null} io
 * @param {object} queueData
 */
function emitQueueDeleted(io, queueData) {
  if (!io) return;
  io.to('admin_room').emit('queue_deleted', {
    type: 'queue_deleted',
    queue: queueData,
  });
  // Also broadcast globally in case users had the queue in view
  io.emit('queue_deleted', {
    type: 'queue_deleted',
    queue: queueData,
  });
}

module.exports = {
  registerQueueSocketHandlers,
  emitQueueUpdate,
  emitTokenCalledToQueue,
  emitOrgQueueUpdate,
  // Governance
  emitQueueCreated,
  emitQueueActivated,
  emitQueueDeactivated,
  emitQueueDeleted,
};
