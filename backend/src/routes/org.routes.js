/**
 * Organization (Service Provider) Routes
 * Additive: does not change existing /api/auth routes.
 */
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/organization.controller');
const { validate } = require('../middleware/validate');

const registerSchema = {
  name: { required: true, type: 'string', min: 2, max: 150, message: 'Organization name is required.' },
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Please provide a valid email address.',
  },
  password: { required: true, type: 'string', min: 6, message: 'Password must be at least 6 characters.' },
};

const loginSchema = {
  email: { required: true, type: 'string', message: 'Email is required.' },
  password: { required: true, type: 'string', message: 'Password is required.' },
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

module.exports = router;

