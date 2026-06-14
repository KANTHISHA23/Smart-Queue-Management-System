/**
 * Notification Routes
 */
const express = require('express');
const router = express.Router();
const { subscribe, getNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.post('/subscribe', authenticate, subscribe);
router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markAsRead);

module.exports = router;
