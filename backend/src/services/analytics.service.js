/**
 * Analytics service — aggregates dashboard metrics
 */
const analyticsRepository = require('../repositories/analytics.repository');

async function getDashboardStats() {
  const [todayStats, activeQueues, totalLocations, totalUsers, busiestQueues, recentActivity] =
    await Promise.all([
      analyticsRepository.getTodayTokenStats(),
      analyticsRepository.countActiveQueues(),
      analyticsRepository.countActiveLocations(),
      analyticsRepository.countUsers(),
      analyticsRepository.getBusiestQueuesToday(),
      analyticsRepository.getRecentActivityToday(),
    ]);

  return {
    ok: true,
    data: {
      today: todayStats.rows[0],
      activeQueues: parseInt(activeQueues.rows[0].count, 10),
      totalLocations: parseInt(totalLocations.rows[0].count, 10),
      totalUsers: parseInt(totalUsers.rows[0].count, 10),
      busiestQueues: busiestQueues.rows,
      recentActivity: recentActivity.rows,
    },
  };
}

async function getDailyStats(days) {
  const result = await analyticsRepository.getDailyStats(parseInt(days, 10));
  return { ok: true, data: result.rows };
}

async function getWaitTimeStats() {
  const result = await analyticsRepository.getWaitTimeStats();
  return { ok: true, data: result.rows };
}

async function getHourlyStats() {
  const result = await analyticsRepository.getHourlyStatsToday();
  return { ok: true, data: result.rows };
}

module.exports = {
  getDashboardStats,
  getDailyStats,
  getWaitTimeStats,
  getHourlyStats,
};
