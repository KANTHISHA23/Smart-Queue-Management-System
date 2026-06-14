/**
 * Token Routes
 */
const express = require('express');
const router = express.Router();
const {
  bookToken, getMyTokens, getTokenHistory, cancelToken,
  getQueueTokens, callToken, serveToken, completeToken,
  skipToken, setPriority, callNextToken, markMissed, rejoinQueue, recallRequest
} = require('../controllers/token.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const bookTokenSchema = {
  queue_id: { required: true, message: 'Queue ID is required.' }
};

// User routes
router.post('/book', authenticate, validate(bookTokenSchema), bookToken);
router.get('/my', authenticate, getMyTokens);
router.get('/history', authenticate, getTokenHistory);
router.put('/:id/cancel', authenticate, cancelToken);
router.post('/:id/rejoin', authenticate, rejoinQueue);
router.post('/:id/recall', authenticate, recallRequest);

// Admin routes
router.get('/queue/:queueId', authenticate, requireRole('admin'), getQueueTokens);
router.put('/call-next/:queueId', authenticate, requireRole('admin'), callNextToken);
router.put('/:id/call', authenticate, requireRole('admin'), callToken);
router.put('/:id/serve', authenticate, requireRole('admin'), serveToken);
router.put('/:id/complete', authenticate, requireRole('admin'), completeToken);
router.put('/:id/skip', authenticate, requireRole('admin'), skipToken);
router.put('/:id/priority', authenticate, requireRole('admin'), setPriority);
router.put('/:id/miss', authenticate, requireRole('admin'), markMissed);

module.exports = router;
