/**
 * Organization Token Controller — HTTP adapter only (multi-tenant)
 */
const tokenService = require('../services/token.service');

const getIo = (req) => req.app.get('io');

const getQueueTokens = async (req, res) => {
  try {
    const { queueId } = req.params;
    const status = req.query.status;
    const result = await tokenService.getQueueTokensForOrganization(queueId, req.organizationId, status);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Org get queue tokens error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue tokens.' });
  }
};

const callNext = async (req, res) => {
  try {
    const { queueId } = req.params;
    const result = await tokenService.callNextTokenForOrganization(queueId, req.organizationId, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org call-next error:', error);
    res.status(500).json({ success: false, message: 'Failed to call next token.' });
  }
};

const skip = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tokenService.skipTokenForOrganization(id, req.organizationId, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org skip token error:', error);
    res.status(500).json({ success: false, message: 'Failed to skip token.' });
  }
};

const complete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tokenService.completeTokenForOrganization(id, req.organizationId, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org complete token error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete token.' });
  }
};

const setPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tokenService.setPriorityForOrganization(id, req.body, req.organizationId, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org set priority token error:', error);
    res.status(500).json({ success: false, message: 'Failed to set priority.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await tokenService.getOrganizationUsers(req.organizationId);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Org get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

module.exports = {
  getQueueTokens,
  callNext,
  skip,
  complete,
  setPriority,
  getUsers,
};

