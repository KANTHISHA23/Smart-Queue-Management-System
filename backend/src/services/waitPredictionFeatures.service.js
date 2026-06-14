/**
 * Builds feature vectors for ML wait-time prediction.
 * Mirrors the schema used by ml/export_training_data.py and ml/app.py.
 */
const tokenRepository = require('../repositories/token.repository');
const { resolveAverageServiceTime } = require('./queueMetricsMath');

async function buildWaitFeatures(context) {
  const {
    queueId,
    peopleAhead = 0,
    position = 1,
    priorityLevel = 'normal',
    avgServiceTime = 5,
    locationType = 'hospital',
    maxCapacity = 100,
    bookedAt = new Date(),
  } = context;

  const [avgRes, queueLengthRes] = await Promise.all([
    tokenRepository.getQueueAverageServiceTime(queueId),
    tokenRepository.countWaitingTokensInQueue(queueId),
  ]);

  const booked = bookedAt instanceof Date ? bookedAt : new Date(bookedAt);
  const dynamicAvg = resolveAverageServiceTime(
    avgRes.rows[0]?.avg_service_time,
    avgServiceTime || 5
  );

  return {
    people_ahead: Math.max(0, Number(peopleAhead) || 0),
    position: Math.max(1, Number(position) || 1),
    priority_level: priorityLevel || 'normal',
    queue_length: parseInt(queueLengthRes.rows[0]?.count || 0, 10),
    avg_service_time_last_20: dynamicAvg,
    queue_avg_service_time: Number(avgServiceTime) || 5,
    hour_of_day: booked.getHours(),
    day_of_week: booked.getDay(),
    location_type: locationType || 'hospital',
    max_capacity: Number(maxCapacity) || 100,
  };
}

module.exports = {
  buildWaitFeatures,
};
