/**
 * Organization Queue Management Routes (multi-tenant)
 * Providers can create, edit, delete, reset — but NOT activate/deactivate.
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listMyQueues,
  createQueue,
  updateQueue,
  deleteQueue,
  resetQueue,
} = require('../controllers/orgQueue.controller');

const createQueueSchema = {
  location_id: { required: true, message: 'Location ID is required.' },
  name: { required: true, type: 'string', min: 2, message: 'Queue name is required.' },
};

router.get('/', authenticate, requireRole('organization'), listMyQueues);
router.post('/', authenticate, requireRole('organization'), validate(createQueueSchema), createQueue);
router.put('/:id', authenticate, requireRole('organization'), updateQueue);
router.delete('/:id', authenticate, requireRole('organization'), deleteQueue);
router.put('/:id/reset', authenticate, requireRole('organization'), resetQueue);

module.exports = router;
