/**
 * Organization Token Management Routes — multi-tenant (additive)
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getQueueTokens,
  callNext,
  skip,
  complete,
  setPriority,
  getUsers,
} = require('../controllers/orgToken.controller');

router.get('/queues/:queueId/tokens', authenticate, requireRole('organization'), getQueueTokens);
router.put('/queues/:queueId/call-next', authenticate, requireRole('organization'), callNext);

router.put('/tokens/:id/skip', authenticate, requireRole('organization'), skip);
router.put('/tokens/:id/complete', authenticate, requireRole('organization'), complete);
router.put('/tokens/:id/priority', authenticate, requireRole('organization'), setPriority);

router.get('/users', authenticate, requireRole('organization'), getUsers);

module.exports = router;

