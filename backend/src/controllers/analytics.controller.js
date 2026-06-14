/**
 * Analytics Controller — HTTP adapter only
 */
const analyticsService = require('../services/analytics.service');

const getDashboardStats = async (req, res) => {
  try {
    const result = await analyticsService.getDashboardStats();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};

const getDailyStats = async (req, res) => {
  try {
    const result = await analyticsService.getDailyStats(req.query.days ?? 7);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily stats.' });
  }
};

const getWaitTimeStats = async (req, res) => {
  try {
    const result = await analyticsService.getWaitTimeStats();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Wait time stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wait time stats.' });
  }
};

const getHourlyStats = async (req, res) => {
  try {
    const result = await analyticsService.getHourlyStats();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Hourly stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hourly stats.' });
  }
};

const getMlModelMetadata = async (req, res) => {
  try {
    const mlMetadataService = require('../services/mlMetadata.service');
    const result = await mlMetadataService.getMlInsights();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('ML metadata error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ML model metadata.' });
  }
};

module.exports = { getDashboardStats, getDailyStats, getWaitTimeStats, getHourlyStats, getMlModelMetadata };
