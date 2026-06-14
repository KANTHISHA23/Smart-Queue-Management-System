/**
 * Token service — booking, lifecycle, and real-time side effects
 */
const { getClient } = require('../config/db');
const tokenRepository = require('../repositories/token.repository');
const { emitQueueUpdate, emitTokenCalledToQueue, emitOrgQueueUpdate } = require('../socket/queue.socket');
const { emitYourTurn, emitPreCallNotification } = require('../socket/notification.socket');
const {
  getEstimatedWait,
} = require('./queueMetrics.service');

/**
 * Sweeps the queue to find any waiting tokens whose predicted wait is <= 10.
 * Notifies them directly and marks them notified in the database.
 */
async function checkAndNotifyUsers(queueId, io) {
  try {
    const unnotifiedResult = await tokenRepository.findUnnotifiedWaitingTokens(queueId);
    if (unnotifiedResult.rows.length === 0) return;

    const tokensToNotify = [];
    
    for (const token of unnotifiedResult.rows) {
      const peopleAhead = parseInt(token.people_ahead, 10);
      const prediction = await getEstimatedWait({
        queueId: token.queue_id,
        peopleAhead,
        position: token.position,
        priorityLevel: token.priority_level,
        avgServiceTime: token.avg_service_time || 5,
        locationType: token.location_type,
        maxCapacity: token.max_capacity,
      });
      const estimatedWait = prediction.estimated_wait;

      if (estimatedWait <= 10 && token.user_id) {
        tokensToNotify.push(token.id);
        emitPreCallNotification(io, token.user_id, {
          tokenId: token.id,
          tokenNumber: token.token_number,
          queueId: token.queue_id,
          message: `⚡ Your turn is coming soon! Estimated wait: ~${estimatedWait} minutes.`,
        });
      }
    }

    if (tokensToNotify.length > 0) {
      await tokenRepository.markTokensNotified(tokensToNotify);
    }
  } catch (error) {
    console.error('Failed to process pre-call notifications:', error);
  }
}

async function enrichTokensWithEstimatedWait(rows) {
  return Promise.all(
    rows.map(async (token) => {
      const peopleAhead = parseInt(token.people_ahead, 10) || 0;

      if (token.status === 'called' || token.status === 'serving') {
        return {
          ...token,
          estimated_wait: 0,
          people_ahead: peopleAhead,
        };
      }

      if (token.status !== 'waiting') {
        return { ...token, people_ahead: peopleAhead };
      }

      const prediction = await getEstimatedWait({
        queueId: token.queue_id,
        peopleAhead,
        position: token.position,
        priorityLevel: token.priority_level,
        avgServiceTime: token.avg_service_time || 5,
        locationType: token.location_type,
        maxCapacity: token.max_capacity,
        bookedAt: token.booked_at,
      });

      return {
        ...token,
        estimated_wait: prediction.estimated_wait,
        prediction_source: prediction.prediction_source,
        people_ahead: peopleAhead,
      };
    })
  );
}

async function mapMyTokens(rows) {
  return enrichTokensWithEstimatedWait(rows);
}

/** Recompute and persist wait times for all active tokens in a queue (after priority changes, etc.). */
async function recalculateAndPersistQueueWaitTimes(queueId) {
  const result = await tokenRepository.findQueueTokensForAdmin(queueId);
  const enriched = await enrichTokensWithEstimatedWait(result.rows);

  await Promise.all(
    enriched
      .filter((token) => token.status === 'waiting')
      .map((token) =>
        tokenRepository.updateTokenEstimatedWait(
          token.id,
          token.estimated_wait,
          token.prediction_source
        )
      )
  );

  return enriched;
}

async function bookToken(body, user, io) {
  const { queue_id, notes, priority_level } = body;
  const userId = user.id;
  const client = await getClient();
  const pLevel = priority_level && ['normal', 'priority', 'emergency'].includes(priority_level) ? priority_level : 'normal';

  try {
    await client.query('BEGIN');

    const queueResult = await tokenRepository.clientFindActiveQueue(client, queue_id);
    if (queueResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'Queue not found or is not active.' };
    }

    const queue = queueResult.rows[0];

    const existingToken = await tokenRepository.clientFindExistingActiveToken(client, queue_id, userId);
    if (existingToken.rows.length > 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 409, message: 'You already have an active token in this queue.' };
    }

    const waitingCount = await tokenRepository.clientCountActiveTokensInQueue(client, queue_id);
    if (parseInt(waitingCount.rows[0].count, 10) >= queue.max_capacity) {
      await client.query('ROLLBACK');
      return { ok: false, status: 400, message: 'This queue is currently full. Please try again later.' };
    }

    await tokenRepository.clientIncrementQueueNumber(client, queue_id);
    const updatedQueue = await tokenRepository.clientGetQueueCounter(client, queue_id);
    const newNumber = updatedQueue.rows[0].current_number;
    const prefix = updatedQueue.rows[0].prefix;
    const tokenNumber = `${prefix}${String(newNumber).padStart(3, '0')}`;
    const position = parseInt(waitingCount.rows[0].count, 10) + 1;
    const locationResult = await tokenRepository.clientLocationNameForQueue(client, queue_id);
    const locationName = locationResult.rows[0]?.location_name || 'Unknown';
    const locationType = locationResult.rows[0]?.location_type || 'hospital';

    const prediction = await getEstimatedWait({
      queueId: queue_id,
      peopleAhead: position - 1,
      position,
      priorityLevel: pLevel,
      avgServiceTime: queue.avg_service_time,
      locationType,
      maxCapacity: queue.max_capacity,
    });
    const estimatedWait = prediction.estimated_wait;

    const tokenResult = await tokenRepository.clientInsertToken(
      client,
      tokenNumber,
      queue_id,
      userId,
      position,
      estimatedWait,
      notes,
      pLevel,
      prediction.prediction_source
    );

    await tokenRepository.clientInsertBookingNotification(
      client,
      userId,
      'Token Booked Successfully',
      `Your token ${tokenNumber} has been booked for ${queue.name} at ${locationName}. Position: ${position}, Estimated wait: ${estimatedWait} minutes.`,
      JSON.stringify({
        token_id: tokenResult.rows[0].id,
        queue_id,
        token_number: tokenNumber,
      })
    );

    await client.query('COMMIT');

    const token = tokenResult.rows[0];
    emitQueueUpdate(io, queue_id, {
      type: 'new-token',
      queueId: queue_id,
      token: {
        id: token.id,
        tokenNumber: token.token_number,
        position: token.position,
        status: token.status,
      },
    });
    
    // Check and notify for >= 10 mins
    setImmediate(() => checkAndNotifyUsers(queue_id, io));

    return {
      ok: true,
      status: 201,
      message: `Token ${tokenNumber} booked successfully!`,
      data: {
        ...token,
        queue_name: queue.name,
        location_name: locationName,
        prediction_source: prediction.prediction_source,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Book token error:', error);
    return { ok: false, status: 500, message: 'Failed to book token.' };
  } finally {
    client.release();
  }
}

async function getMyTokens(userId) {
  const result = await tokenRepository.findMyActiveTokens(userId);
  const data = await mapMyTokens(result.rows);
  return { ok: true, data };
}

async function getTokenHistory(userId, queryParams) {
  const { page = 1, limit = 20 } = queryParams;
  const offset = (page - 1) * limit;

  const countResult = await tokenRepository.countTokensByUser(userId);
  const result = await tokenRepository.findHistoryPage(userId, parseInt(limit, 10), parseInt(offset, 10));
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    ok: true,
    data: {
      tokens: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

async function cancelToken(tokenId, userId, io) {
  const existing = await tokenRepository.findCancellableByUser(tokenId, userId);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be cancelled.' };
  }

  await tokenRepository.setTokenCancelled(tokenId);
  const token = existing.rows[0];

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-cancelled',
    queueId: token.queue_id,
    tokenId: token.id,
  });

  return {
    ok: true,
    message: `Token ${token.token_number} cancelled successfully.`,
    data: { ...token, status: 'cancelled' },
  };
}

async function getQueueTokens(queueId, status) {
  const result = await tokenRepository.findQueueTokensForAdmin(queueId, status);
  const data = await enrichTokensWithEstimatedWait(result.rows);
  return { ok: true, data };
}

// ---------- Organization-scoped actions ----------

async function getQueueTokensForOrganization(queueId, organizationId, status) {
  const result = await tokenRepository.findQueueTokensForOrganization(queueId, organizationId, status);
  const data = await enrichTokensWithEstimatedWait(result.rows);
  return { ok: true, data };
}

async function getOrganizationUsers(organizationId) {
  const result = await tokenRepository.findUsersInOrganizationQueues(organizationId);
  return { ok: true, data: result.rows };
}

async function callToken(tokenId, io) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await tokenRepository.clientFindTokenWaiting(client, tokenId);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'Token not found or not in waiting status.' };
    }

    await tokenRepository.clientSetTokenCalled(client, tokenId);
    const token = { ...existing.rows[0], status: 'called', called_at: new Date().toISOString() };

    await tokenRepository.clientUpdateQueueNowServing(client, token.position, token.queue_id);

    if (token.user_id) {
      await tokenRepository.clientInsertTurnNotification(
        client,
        token.user_id,
        `Token ${token.token_number} has been called! Please proceed to the counter.`,
        JSON.stringify({ token_id: token.id, queue_id: token.queue_id })
      );
    }

    const upcomingTokens = await tokenRepository.clientFindUpcomingWaiting(client, token.queue_id, token.position);
    for (const upcoming of upcomingTokens.rows) {
      const positionsAhead = upcoming.position - token.position;
      if (positionsAhead <= 3 && upcoming.user_id) {
        await tokenRepository.clientInsertApproachingNotification(
          client,
          upcoming.user_id,
          `Your turn is approaching! You are ${positionsAhead} position(s) away. Token: ${upcoming.token_number}`,
          JSON.stringify({
            token_id: upcoming.id,
            queue_id: token.queue_id,
            positions_ahead: positionsAhead,
          })
        );
      }
    }

    await client.query('COMMIT');

    emitTokenCalledToQueue(io, token.queue_id, {
      id: token.id,
      tokenNumber: token.token_number,
      position: token.position,
      userId: token.user_id,
    });
    if (token.user_id) {
      emitYourTurn(io, token.user_id, {
        tokenNumber: token.token_number,
        queueId: token.queue_id,
      });
    }

    return { ok: true, message: `Token ${token.token_number} has been called.`, data: token };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Call token error:', error);
    return { ok: false, status: 500, message: 'Failed to call token.' };
  } finally {
    client.release();
  }
}

async function serveToken(tokenId) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['called']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or not called.' };
  }

  await tokenRepository.updateTokenServing(tokenId);
  const token = { ...existing.rows[0], status: 'serving' };
  return { ok: true, message: `Token ${token.token_number} is now being served.`, data: token };
}

async function completeToken(tokenId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['called', 'serving']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be completed.' };
  }

  await tokenRepository.updateTokenCompleted(tokenId);
  const token = { ...existing.rows[0], status: 'completed' };

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-completed',
    queueId: token.queue_id,
    tokenId: token.id,
  });
  
  // AI Prediction Trigger: A token finishing means the average wait time may have shifted.
  io.to(`queue-${token.queue_id}`).emit('waiting_time_updated', { queueId: token.queue_id });

  // Sweep for 10-min alerts since queue advanced
  setImmediate(() => checkAndNotifyUsers(token.queue_id, io));

  return { ok: true, message: `Token ${token.token_number} completed.`, data: token };
}

async function skipToken(tokenId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['waiting', 'called']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be skipped.' };
  }

  await tokenRepository.updateTokenSkipped(tokenId);
  const token = { ...existing.rows[0], status: 'skipped' };

  if (token.user_id) {
    await tokenRepository.insertSkipNotification(
      token.user_id,
      `Your token ${token.token_number} has been skipped. Please contact the counter for assistance.`
    );
  }

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-skipped',
    queueId: token.queue_id,
    tokenId: token.id,
  });

  // Skip shifts the queue
  setImmediate(() => checkAndNotifyUsers(token.queue_id, io));

  return { ok: true, message: `Token ${token.token_number} skipped.`, data: token };
}

async function setPriority(tokenId, body, io) {
  const { priority_level, priority_reason } = body;
  const existing = await tokenRepository.findByIdWaiting(tokenId);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or not waiting.' };
  }

  const pLevel = priority_level || 'normal';
  const reason = priority_reason || '';
  await tokenRepository.updateTokenPriority(tokenId, pLevel, reason);
  const token = { ...existing.rows[0], priority_level: pLevel, priority_reason: reason };

  await recalculateAndPersistQueueWaitTimes(token.queue_id);

  // Notify clients about this specific token change
  emitQueueUpdate(io, token.queue_id, {
    type: 'priority-changed',
    queueId: token.queue_id,
    tokenId: token.id,
    priorityLevel: pLevel,
  });

  // Also tell everyone looking at the queue to re-sort their wait lists
  io.to(`queue-${token.queue_id}`).emit('queue_reordered', { queueId: token.queue_id });
  io.to(`queue-${token.queue_id}`).emit('waiting_time_updated', { queueId: token.queue_id });

  setImmediate(() => checkAndNotifyUsers(token.queue_id, io));

  return {
    ok: true,
    message: `Token ${token.token_number} priority updated to ${pLevel}.`,
    data: token,
  };
}

async function callNextToken(queueId, io) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    await tokenRepository.clientCompleteServingInQueue(client, queueId);

    const nextToken = await tokenRepository.clientFindNextWaitingToken(client, queueId);
    if (nextToken.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'No more tokens waiting in this queue.' };
    }

    const token = nextToken.rows[0];
    await tokenRepository.clientSetTokenCalled(client, token.id);
    await tokenRepository.clientUpdateQueueNowServing(client, token.position, queueId);

    if (token.user_id) {
      await tokenRepository.clientInsertTurnNotification(
        client,
        token.user_id,
        `Token ${token.token_number} has been called! Please proceed to the counter.`,
        JSON.stringify({ token_id: token.id, queue_id: queueId })
      );
    }

    await client.query('COMMIT');

    const qid = parseInt(queueId, 10);
    emitTokenCalledToQueue(io, qid, {
      id: token.id,
      tokenNumber: token.token_number,
      position: token.position,
      userId: token.user_id,
    });
    if (token.user_id) {
      emitYourTurn(io, token.user_id, {
        tokenNumber: token.token_number,
        queueId: qid,
      });
    }
    
    // AI Prediction Trigger: tokens may have advanced or been completed
    io.to(`queue-${qid}`).emit('waiting_time_updated', { queueId: qid });

    // Pre-call notification sweep
    setImmediate(() => checkAndNotifyUsers(qid, io));

    return {
      ok: true,
      message: `Token ${token.token_number} has been called.`,
      data: { ...token, status: 'called', called_at: new Date() },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Call next token error:', error);
    return { ok: false, status: 500, message: 'Failed to call next token.' };
  } finally {
    client.release();
  }
}

async function callNextTokenForOrganization(queueId, organizationId, io) {
  const ownsQueue = await tokenRepository.queueBelongsToOrganization(queueId, organizationId);
  if (ownsQueue.rows.length === 0) {
    return { ok: false, status: 403, message: 'You do not have access to this queue.' };
  }

  const result = await callNextToken(queueId, io);
  if (result.ok) {
    emitOrgQueueUpdate(io, organizationId, {
      type: 'token-called',
      queueId: parseInt(queueId, 10),
      tokenId: result.data.id,
      tokenNumber: result.data.token_number,
    });
  }

  return result;
}

async function skipTokenForOrganization(tokenId, organizationId, io) {
  const ownership = await tokenRepository.tokenBelongsToOrganization(tokenId, organizationId);
  if (ownership.rows.length === 0) {
    return { ok: false, status: 403, message: 'You do not have access to this token.' };
  }

  const result = await skipToken(tokenId, io);
  if (result.ok) {
    emitOrgQueueUpdate(io, organizationId, {
      type: 'token-skipped',
      queueId: result.data.queue_id,
      tokenId: result.data.id,
      tokenNumber: result.data.token_number,
    });
  }

  return result;
}

async function completeTokenForOrganization(tokenId, organizationId, io) {
  const ownership = await tokenRepository.tokenBelongsToOrganization(tokenId, organizationId);
  if (ownership.rows.length === 0) {
    return { ok: false, status: 403, message: 'You do not have access to this token.' };
  }

  const result = await completeToken(tokenId, io);
  if (result.ok) {
    emitOrgQueueUpdate(io, organizationId, {
      type: 'token-completed',
      queueId: result.data.queue_id,
      tokenId: result.data.id,
      tokenNumber: result.data.token_number,
    });
  }

  return result;
}

async function setPriorityForOrganization(tokenId, body, organizationId, io) {
  const ownership = await tokenRepository.tokenBelongsToOrganization(tokenId, organizationId);
  if (ownership.rows.length === 0) {
    return { ok: false, status: 403, message: 'You do not have access to this token.' };
  }
  return await setPriority(tokenId, body, io);
}

async function markMissed(tokenId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['waiting', 'called']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be marked as missed.' };
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await tokenRepository.clientUpdateTokenMissed(client, tokenId);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const token = { ...existing.rows[0], status: 'missed' };

  if (token.user_id) {
    await tokenRepository.insertSkipNotification(
      token.user_id,
      `Your token ${token.token_number} has been marked as missed.`
    );
  }

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-missed',
    queueId: token.queue_id,
    tokenId: token.id,
  });

  return { ok: true, message: `Token ${token.token_number} marked as missed.`, data: token };
}

async function markMissedForOrganization(tokenId, organizationId, io) {
  const ownership = await tokenRepository.tokenBelongsToOrganization(tokenId, organizationId);
  if (ownership.rows.length === 0) {
    return { ok: false, status: 403, message: 'You do not have access to this token.' };
  }

  const result = await markMissed(tokenId, io);
  if (result.ok) {
    emitOrgQueueUpdate(io, organizationId, {
      type: 'token-missed',
      queueId: result.data.queue_id,
      tokenId: result.data.id,
      tokenNumber: result.data.token_number,
    });
  }

  return result;
}

async function recoverRejoinQueue(tokenId, userId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['missed']);
  if (existing.rows.length === 0 || existing.rows[0].user_id !== userId) {
    return { ok: false, status: 404, message: 'Token not found, or you do not own it, or it is not missed.' };
  }

  const token = existing.rows[0];
  if (token.recovery_attempts >= 1) {
    return { ok: false, status: 403, message: 'Recovery limit reached for this token.' };
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const maxPosResult = await tokenRepository.clientGetMaxPosition(client, token.queue_id);
    const maxPosition = parseInt(maxPosResult.rows[0].max_position, 10);
    const newPosition = maxPosition + 1;

    await tokenRepository.clientRecoverRejoin(client, tokenId, newPosition);
    await client.query('COMMIT');
    
    emitQueueUpdate(io, token.queue_id, {
      type: 'token-rejoined',
      queueId: token.queue_id,
      tokenId: token.id,
      position: newPosition
    });
    
    return { ok: true, message: `Successfully rejoined the queue.`, data: { ...token, status: 'waiting', position: newPosition, recovery_attempts: token.recovery_attempts + 1 } };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rejoin queue error:', err);
    return { ok: false, status: 500, message: 'Failed to rejoin queue.' };
  } finally {
    client.release();
  }
}

async function recoverRecallRequest(tokenId, userId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['missed']);
  if (existing.rows.length === 0 || existing.rows[0].user_id !== userId) {
    return { ok: false, status: 404, message: 'Token not found, or you do not own it, or it is not missed.' };
  }

  const token = existing.rows[0];
  if (token.recovery_attempts >= 1) {
    return { ok: false, status: 403, message: 'Recovery limit reached for this token.' };
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await tokenRepository.clientRecoverRecall(client, tokenId);
    await client.query('COMMIT');

    emitQueueUpdate(io, token.queue_id, {
      type: 'token-recalled',
      queueId: token.queue_id,
      tokenId: token.id,
    });
    
    io.to(`queue-${token.queue_id}`).emit('queue_reordered', { queueId: token.queue_id });

    return { ok: true, message: `Recall requested successfully.`, data: { ...token, status: 'waiting', recovery_attempts: token.recovery_attempts + 1 } };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Recall request error:', err);
    return { ok: false, status: 500, message: 'Failed to request recall.' };
  } finally {
    client.release();
  }
}

module.exports = {
  checkAndNotifyUsers,
  bookToken,
  getMyTokens,
  getTokenHistory,
  cancelToken,
  getQueueTokens,
  getQueueTokensForOrganization,
  getOrganizationUsers,
  callToken,
  serveToken,
  completeToken,
  skipToken,
  setPriority,
  callNextToken,
  callNextTokenForOrganization,
  skipTokenForOrganization,
  completeTokenForOrganization,
  setPriorityForOrganization,
  markMissed,
  markMissedForOrganization,
  recoverRejoinQueue,
  recoverRecallRequest,
};
