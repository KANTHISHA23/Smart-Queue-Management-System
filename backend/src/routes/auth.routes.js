/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { register, login, refreshToken, getProfile, updateProfile, uploadProfileAvatar } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadAvatar } = require('../middleware/uploadAvatar');

// Registration validation schema
const registerSchema = {
  name: { required: true, type: 'string', min: 2, max: 100, message: 'Name is required (2-100 characters).' },
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Please provide a valid email address.'
  },
  password: { required: true, type: 'string', min: 6, message: 'Password must be at least 6 characters.' }
};

// Login validation schema
const loginSchema = {
  email: { required: true, type: 'string', message: 'Email is required.' },
  password: { required: true, type: 'string', message: 'Password is required.' }
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/avatar', authenticate, uploadAvatar.single('avatar'), uploadProfileAvatar);

module.exports = router;
