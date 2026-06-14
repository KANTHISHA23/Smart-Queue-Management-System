/**
 * Organization Analytics Controller — provider-scoped queue insights.
 */
const orgAnalyticsService = require('../services/orgAnalytics.service');

const getDashboard = async (req, res) => {
  try {
    const data = await orgAnalyticsService.getDashboard(req.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Org analytics dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

const getDaily = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const data = await orgAnalyticsService.getDailyStats(req.organizationId, days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Org daily analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily stats.' });
  }
};

const getWaitTimes = async (req, res) => {
  try {
    const data = await orgAnalyticsService.getWaitTimesByQueue(req.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Org wait times error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wait times.' });
  }
};

const getHourly = async (req, res) => {
  try {
    const data = await orgAnalyticsService.getHourlyDistribution(req.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Org hourly analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hourly stats.' });
  }
};

module.exports = { getDashboard, getDaily, getWaitTimes, getHourly };
