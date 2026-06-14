/**
 * Queue service — business rules for queue operations
 */
const queueRepository = require('../repositories/queue.repository');
const locationRepository = require('../repositories/location.repository');
const {
  getDynamicAverageServiceTime,
  getEstimatedWait,
} = require('./queueMetrics.service');

async function getQueueById(id) {
  const queueResult = await queueRepository.findWithLocationById(id);
  if (queueResult.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  const [waitingResult, statsResult] = await Promise.all([
    queueRepository.findWaitingTokensByQueueId(id),
    queueRepository.getTodayStatsByQueueId(id),
  ]);

  const queue = queueResult.rows[0];
  const stats = statsResult.rows[0];
  const dynamicAvg = await getDynamicAverageServiceTime(id, queue.avg_service_time);

  const tokens = await Promise.all(
    waitingResult.rows.map(async (t) => {
      const peopleAhead = parseInt(t.people_ahead ?? t.position ?? 0, 10);
      const prediction = await getEstimatedWait({
        queueId: id,
        peopleAhead,
        position: t.position,
        priorityLevel: t.priority_level,
        avgServiceTime: t.avg_service_time || queue.avg_service_time,
        locationType: t.location_type,
        maxCapacity: t.max_capacity || queue.max_capacity,
        bookedAt: t.booked_at,
      });
      return {
        ...t,
        estimated_wait: prediction.estimated_wait,
        prediction_source: prediction.prediction_source,
      };
    })
  );

  stats.avg_service_time = dynamicAvg;

  return {
    ok: true,
    data: {
      queue,
      tokens,
      stats,
    },
  };
}

async function createQueue(body) {
  const { location_id, name, description, prefix, max_capacity, avg_service_time } = body;

  const locationCheck = await locationRepository.existsById(location_id);
  if (locationCheck.rows.length === 0) {
    return { ok: false, status: 404, message: 'Location not found.' };
  }

  const result = await queueRepository.insert(
    location_id,
    name,
    description,
    prefix || 'A',
    max_capacity || 100,
    avg_service_time || 5
  );

  return { ok: true, status: 201, message: 'Queue created successfully.', data: result.rows[0] };
}

async function updateQueue(id, body) {
  const { name, description, prefix, max_capacity, avg_service_time, status } = body;
  const result = await queueRepository.updateById(
    id,
    name,
    description,
    prefix,
    max_capacity,
    avg_service_time,
    status
  );

  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  return { ok: true, message: 'Queue updated successfully.', data: result.rows[0] };
}

async function deleteQueue(id) {
  const existing = await queueRepository.findSummaryById(id);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  await queueRepository.deleteById(id);
  return {
    ok: true,
    message: `Queue "${existing.rows[0].name}" deleted successfully.`,
  };
}

async function resetQueue(id) {
  await queueRepository.resetCounters(id);
  await queueRepository.cancelWaitingTokensForQueue(id);
  return { ok: true, message: 'Queue reset successfully.' };
}

// ---------- Organization-scoped (multi-tenant) ----------

async function getOrganizationQueues(organizationId) {
  const result = await queueRepository.findManyByOrganizationId(organizationId);
  return { ok: true, data: result.rows };
}

async function createQueueForOrganization(organizationId, body) {
  const { location_id, name, description, prefix, max_capacity, avg_service_time } = body;

  const locationCheck = await locationRepository.existsById(location_id);
  if (locationCheck.rows.length === 0) {
    return { ok: false, status: 404, message: 'Location not found.' };
  }

  const result = await queueRepository.insertForOrganization(
    organizationId,
    location_id,
    name,
    description,
    prefix || 'A',
    max_capacity || 100,
    avg_service_time || 5
  );

  // New queues start as 'pending' — admin must activate
  if (result.rows[0]) {
    await queueRepository.updateStatusById(result.rows[0].id, 'pending');
    result.rows[0].status = 'pending';
  }

  return { ok: true, status: 201, message: 'Queue created (pending admin approval).', data: result.rows[0] };
}

async function updateQueueForOrganization(organizationId, id, body) {
  // Provider cannot change status — strip it
  const { name, description, prefix, max_capacity, avg_service_time } = body;
  const result = await queueRepository.updateByIdForOrganization(
    organizationId,
    id,
    name,
    description,
    prefix,
    max_capacity,
    avg_service_time,
    undefined // status is NOT passed — providers cannot change it
  );

  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  return { ok: true, message: 'Queue updated successfully.', data: result.rows[0] };
}

async function deleteQueueForOrganization(organizationId, id) {
  const existing = await queueRepository.findSummaryByIdForOrganization(organizationId, id);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  await queueRepository.deleteByIdForOrganization(organizationId, id);
  return {
    ok: true,
    message: `Queue \"${existing.rows[0].name}\" deleted successfully.`,
  };
}

async function resetQueueForOrganization(organizationId, id) {
  const r = await queueRepository.resetCountersForOrganization(organizationId, id);
  if (r.rowCount === 0) return { ok: false, status: 404, message: 'Queue not found.' };

  await queueRepository.cancelWaitingTokensForQueueForOrganization(organizationId, id);
  return { ok: true, message: 'Queue reset successfully.' };
}

// ---------- Admin governance ----------

async function getAllQueuesAdmin() {
  const result = await queueRepository.findAllWithOrgAndLocation();
  return { ok: true, data: result.rows };
}

async function activateQueue(id) {
  const existing = await queueRepository.findById(id);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  const queue = existing.rows[0];
  if (queue.status === 'active') {
    return { ok: false, status: 400, message: 'Queue is already active.' };
  }

  const result = await queueRepository.updateStatusById(id, 'active');
  return { ok: true, message: 'Queue activated successfully.', data: result.rows[0] };
}

async function deactivateQueue(id) {
  const existing = await queueRepository.findById(id);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  const queue = existing.rows[0];
  if (queue.status === 'inactive') {
    return { ok: false, status: 400, message: 'Queue is already inactive.' };
  }

  const result = await queueRepository.updateStatusById(id, 'inactive');
  return { ok: true, message: 'Queue deactivated successfully.', data: result.rows[0] };
}

// ---------- User-facing ----------

async function getActiveQueues() {
  const result = await queueRepository.findActiveQueues();
  return { ok: true, data: result.rows };
}

module.exports = {
  getQueueById,
  createQueue,
  updateQueue,
  deleteQueue,
  resetQueue,
  // org-scoped
  getOrganizationQueues,
  createQueueForOrganization,
  updateQueueForOrganization,
  deleteQueueForOrganization,
  resetQueueForOrganization,
  // admin governance
  getAllQueuesAdmin,
  activateQueue,
  deactivateQueue,
  // user-facing
  getActiveQueues,
};
