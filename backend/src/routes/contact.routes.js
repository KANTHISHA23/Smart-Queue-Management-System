const express = require('express');
const router = express.Router();
const { submitQuery } = require('../controllers/contact.controller');
const rateLimit = require('express-rate-limit');

// Prevent spam submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour limit per IP
  message: {
    success: false,
    message: 'Too many queries submitted. Please try again later.'
  }
});

// POST /api/contact -> submit a query
router.post('/', contactLimiter, submitQuery);

module.exports = router;
