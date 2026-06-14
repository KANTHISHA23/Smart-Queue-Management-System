/**
 * ML prediction client with heuristic fallback.
 */
const { buildWaitFeatures } = require('./waitPredictionFeatures.service');
const { calculateEstimatedWait } = require('./queueMetricsMath');

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8001').replace(/\/$/, '');
const ML_PREDICTION_ENABLED = process.env.ML_PREDICTION_ENABLED !== 'false';
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || '2000', 10);

async function callMlService(features) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`);
    }

    const data = await response.json();
    const minutes = Math.max(0, Math.round(Number(data.estimated_wait_minutes) || 0));
    return {
      estimated_wait: minutes,
      prediction_source: 'ml',
      model: data.model || 'random_forest',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function heuristicFallback(context, features) {
  const peopleAhead = features?.people_ahead ?? context.peopleAhead ?? 0;
  const avg = features?.avg_service_time_last_20 ?? context.avgServiceTime ?? 5;
  return {
    estimated_wait: calculateEstimatedWait(peopleAhead, avg),
    prediction_source: 'heuristic',
    model: 'baseline_heuristic',
  };
}

/**
 * Primary: Random Forest via ML microservice.
 * Fallback: people_ahead × rolling avg service time.
 */
async function predictWaitTime(context) {
  let features;
  try {
    features = await buildWaitFeatures(context);
  } catch (error) {
    console.warn('Failed to build wait features, using heuristic:', error.message);
    return heuristicFallback(context);
  }

  if (!ML_PREDICTION_ENABLED) {
    return heuristicFallback(context, features);
  }

  try {
    return await callMlService(features);
  } catch (error) {
    console.warn('ML prediction unavailable, using heuristic fallback:', error.message);
    return heuristicFallback(context, features);
  }
}

module.exports = {
  predictWaitTime,
};
