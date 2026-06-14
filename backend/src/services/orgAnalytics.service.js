/**
 * Organization analytics — scoped to the signed-in provider's queues only.
 */
const orgAnalyticsRepo = require('../repositories/orgAnalytics.repository');

const getDashboard = async (organizationId) => {
  const [overview, busiest, recent, completion] = await Promise.all([
    orgAnalyticsRepo.getDashboardOverview(organizationId),
    orgAnalyticsRepo.getBusiestQueues(organizationId, 5),
    orgAnalyticsRepo.getRecentActivity(organizationId, 8),
    orgAnalyticsRepo.getCompletionRate(organizationId, 7),
  ]);

  const { total, completed, cancelled } = completion;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  return {
    overview,
    busiest,
    recent,
    completion: { total, completed, cancelled, completionRate, cancellationRate },
  };
};

const getDailyStats = async (organizationId, days = 7) =>
  orgAnalyticsRepo.getDailyStats(organizationId, days);

const getWaitTimesByQueue = async (organizationId) =>
  orgAnalyticsRepo.getWaitTimesByQueue(organizationId);

const getHourlyDistribution = async (organizationId) =>
  orgAnalyticsRepo.getHourlyDistribution(organizationId);

module.exports = {
  getDashboard,
  getDailyStats,
  getWaitTimesByQueue,
  getHourlyDistribution,
};
