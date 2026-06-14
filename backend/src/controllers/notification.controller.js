/**
 * Notification Controller — HTTP adapter only
 */
const notificationService = require('../services/notification.service');

const subscribe = async (req, res) => {
  try {
    const result = await notificationService.subscribe(req.user.id, req.body.subscription);
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe.' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getNotifications(req.user.id, req.query);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
};

module.exports = { subscribe, getNotifications, markAsRead, markAllAsRead };
