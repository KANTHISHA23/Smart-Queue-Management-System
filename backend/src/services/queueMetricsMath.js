/**
 * Pure wait-time math helpers (no service dependencies).
 */
function resolveAverageServiceTime(avgValue, fallbackAvg = 5) {
  const normalizedAvg = Number(avgValue);
  const fallback = Number(fallbackAvg) || 5;
  return normalizedAvg > 0 ? Math.round(normalizedAvg) : fallback;
}

function calculateEstimatedWait(peopleAhead, averageServiceTime) {
  const ahead = Math.max(0, Number(peopleAhead) || 0);
  const avg = Math.max(0, Number(averageServiceTime) || 0);
  return Math.max(0, Math.round(ahead * avg));
}

module.exports = {
  resolveAverageServiceTime,
  calculateEstimatedWait,
};
