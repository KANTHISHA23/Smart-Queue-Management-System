/**
 * Auth Controller — HTTP adapter only
 */
const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.status(result.status).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

const refreshToken = async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
  res.json({ success: true, data: result.data });
};

const getProfile = async (req, res) => {
  try {
    const accountId =
      req.user.role === 'organization' ? req.organizationId || req.user.id : req.user.id;
    const result = await authService.getProfile(accountId, req.user.role);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const accountId =
      req.user.role === 'organization' ? req.organizationId || req.user.id : req.user.id;
    const result = await authService.updateProfile(accountId, req.user.role, req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

const uploadProfileAvatar = async (req, res) => {
  try {
    const accountId =
      req.user.role === 'organization' ? req.organizationId || req.user.id : req.user.id;
    const result = await authService.uploadProfileAvatar(accountId, req.user.role, req.file);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile photo.' });
  }
};

module.exports = { register, login, refreshToken, getProfile, updateProfile, uploadProfileAvatar };
