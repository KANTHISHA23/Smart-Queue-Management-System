/**
 * Shared queue metrics helpers.
 * Keeps wait-time calculations consistent across queue, token, and public tracking flows.
 */
const tokenRepository = require('../repositories/token.repository');
const { predictWaitTime } = require('./mlPrediction.service');
const {
  resolveAverageServiceTime,
  calculateEstimatedWait,
} = require('./queueMetricsMath');

async function getDynamicAverageServiceTime(queueId, fallbackAvg = 5) {
  const result = await tokenRepository.getQueueAverageServiceTime(queueId);
  return resolveAverageServiceTime(result.rows[0]?.avg_service_time, fallbackAvg);
}

/**
 * Primary: ML Random Forest (when service available).
 * Fallback: people_ahead × rolling average service time.
 */
async function getEstimatedWait(context) {
  return predictWaitTime(context);
}

module.exports = {
  resolveAverageServiceTime,
  getDynamicAverageServiceTime,
  calculateEstimatedWait,
  getEstimatedWait,
};
