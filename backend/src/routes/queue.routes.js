/**
 * Queue Routes
 */
const express = require('express');
const router = express.Router();
const { getActiveQueues, getQueueById, createQueue, updateQueue, deleteQueue, resetQueue } = require('../controllers/queue.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const createQueueSchema = {
  location_id: { required: true, message: 'Location ID is required.' },
  name: { required: true, type: 'string', min: 2, message: 'Queue name is required.' }
};

// Public routes — users only see active queues
router.get('/', getActiveQueues);
router.get('/:id', getQueueById);

// Admin routes
router.post('/', authenticate, requireRole('admin'), validate(createQueueSchema), createQueue);
router.put('/:id', authenticate, requireRole('admin'), updateQueue);
router.delete('/:id', authenticate, requireRole('admin'), deleteQueue);
router.put('/:id/reset', authenticate, requireRole('admin'), resetQueue);

module.exports = router;

