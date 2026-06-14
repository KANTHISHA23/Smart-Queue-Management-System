/**
 * Public token tracking service.
 * Anonymous, read-only projection for token status tracking.
 */
const publicTokenRepository = require('../repositories/publicToken.repository');
const { getEstimatedWait } = require('./queueMetrics.service');

const TRACKABLE_STATUSES = new Set(['waiting', 'called', 'serving', 'completed', 'missed']);

function normalizePublicStatus(status) {
  if (status === 'called' || status === 'serving') return 'serving';
  return status;
}

function getQueuePosition(status, peopleAhead) {
  return status === 'waiting' ? peopleAhead + 1 : 0;
}

async function getPublicTokenStatus(tokenIdentifier) {
  const normalizedIdentifier = String(tokenIdentifier || '').trim();
  if (!normalizedIdentifier) {
    return { ok: false, status: 400, message: 'Token ID is required.' };
  }

  const result = await publicTokenRepository.findTrackableTokenByIdentifier(normalizedIdentifier);
  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found.' };
  }

  const token = result.rows[0];
  if (!TRACKABLE_STATUSES.has(token.status)) {
    return {
      ok: false,
      status: 404,
      message: 'Token not found or not available for public tracking.',
    };
  }

  const peopleAheadResult =
    token.status === 'waiting'
      ? await publicTokenRepository.countWaitingAhead(token.queue_id, token.position, token.priority_level)
      : { rows: [{ count: 0 }] };

  const peopleAhead = parseInt(peopleAheadResult.rows[0]?.count || 0, 10);
  const normalizedStatus = normalizePublicStatus(token.status);

  let estimatedWaitTime = 0;
  let predictionSource = 'heuristic';
  if (token.status === 'waiting') {
    const prediction = await getEstimatedWait({
      queueId: token.queue_id,
      peopleAhead,
      position: token.position,
      priorityLevel: token.priority_level,
      avgServiceTime: token.avg_service_time,
      locationType: token.location_type,
      maxCapacity: token.max_capacity,
      bookedAt: token.booked_at,
    });
    estimatedWaitTime = prediction.estimated_wait;
    predictionSource = prediction.prediction_source;
  }

  return {
    ok: true,
    data: {
      token_id: token.id,
      queue_id: token.queue_id,
      token_number: token.token_number,
      status: normalizedStatus,
      queue_name: token.queue_name,
      current_serving_token: token.current_serving_token,
      position_in_queue: getQueuePosition(token.status, peopleAhead),
      estimated_wait_time: estimatedWaitTime,
      prediction_source: predictionSource,
    },
  };
}

module.exports = {
  getPublicTokenStatus,
};
