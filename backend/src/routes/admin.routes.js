/**
 * Admin Routes — Queue governance
 * All routes protected by authenticate + requireRole('admin')
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllQueues, activateQueue, deactivateQueue } = require('../controllers/admin.controller');
const { getQueries, updateStatus, deleteQuery } = require('../controllers/contact.controller');

// GET  /api/admin/queues              → view all queues (all statuses)
// POST /api/admin/queues/:id/activate → set status = active
// POST /api/admin/queues/:id/deactivate → set status = inactive
router.get('/queues', authenticate, requireRole('admin'), getAllQueues);
router.post('/queues/:id/activate', authenticate, requireRole('admin'), activateQueue);
router.post('/queues/:id/deactivate', authenticate, requireRole('admin'), deactivateQueue);

// GET  /api/admin/queries              → view all contact queries
// PATCH /api/admin/queries/:id         → change query status
// DELETE /api/admin/queries/:id        → delete query
router.get('/queries', authenticate, requireRole('admin'), getQueries);
router.patch('/queries/:id', authenticate, requireRole('admin'), updateStatus);
router.delete('/queries/:id', authenticate, requireRole('admin'), deleteQuery);

module.exports = router;
