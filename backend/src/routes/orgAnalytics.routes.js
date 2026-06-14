/**
 * Organization Analytics Routes — tenant-scoped to the signed-in provider.
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getDashboard,
  getDaily,
  getWaitTimes,
  getHourly,
} = require('../controllers/orgAnalytics.controller');

router.use(authenticate, requireRole('organization'));

router.get('/dashboard', getDashboard);
router.get('/daily', getDaily);
router.get('/wait-times', getWaitTimes);
router.get('/hourly', getHourly);

module.exports = router;
