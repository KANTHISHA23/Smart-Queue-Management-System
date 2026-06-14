/**
 * Organization Controller — HTTP adapter only
 */
const organizationService = require('../services/organization.service');

const register = async (req, res) => {
  try {
    const result = await organizationService.register(req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.status(result.status).json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org register error:', error);
    res.status(500).json({ success: false, message: 'Organization registration failed.' });
  }
};

const login = async (req, res) => {
  try {
    const result = await organizationService.login(req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org login error:', error);
    res.status(500).json({ success: false, message: 'Organization login failed.' });
  }
};

module.exports = { register, login };

