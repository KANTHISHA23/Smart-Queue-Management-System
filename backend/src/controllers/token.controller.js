/**
 * Token Controller — HTTP adapter only
 */
const tokenService = require('../services/token.service');

const getIo = (req) => req.app.get('io');

const bookToken = async (req, res) => {
  try {
    const result = await tokenService.bookToken(req.body, req.user, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.status(result.status).json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Book token error:', error);
    res.status(500).json({ success: false, message: 'Failed to book token.' });
  }
};

const getMyTokens = async (req, res) => {
  try {
    const result = await tokenService.getMyTokens(req.user.id);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get my tokens error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tokens.' });
  }
};

const getTokenHistory = async (req, res) => {
  try {
    const result = await tokenService.getTokenHistory(req.user.id, req.query);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get token history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
};

const cancelToken = async (req, res) => {
  try {
    const result = await tokenService.cancelToken(req.params.id, req.user.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Cancel token error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel token.' });
  }
};

const getQueueTokens = async (req, res) => {
  try {
    const result = await tokenService.getQueueTokens(req.params.queueId, req.query.status);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get queue tokens error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue tokens.' });
  }
};

const callToken = async (req, res) => {
  try {
    const result = await tokenService.callToken(req.params.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Call token error:', error);
    res.status(500).json({ success: false, message: 'Failed to call token.' });
  }
};

const serveToken = async (req, res) => {
  try {
    const result = await tokenService.serveToken(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Serve token error:', error);
    res.status(500).json({ success: false, message: 'Failed to serve token.' });
  }
};

const completeToken = async (req, res) => {
  try {
    const result = await tokenService.completeToken(req.params.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Complete token error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete token.' });
  }
};

const skipToken = async (req, res) => {
  try {
    const result = await tokenService.skipToken(req.params.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Skip token error:', error);
    res.status(500).json({ success: false, message: 'Failed to skip token.' });
  }
};

const setPriority = async (req, res) => {
  try {
    const result = await tokenService.setPriority(req.params.id, req.body, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Set priority error:', error);
    res.status(500).json({ success: false, message: 'Failed to set priority.' });
  }
};

const callNextToken = async (req, res) => {
  try {
    const result = await tokenService.callNextToken(req.params.queueId, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Call next token error:', error);
    res.status(500).json({ success: false, message: 'Failed to call next token.' });
  }
};

const markMissed = async (req, res) => {
  try {
    const result = await tokenService.markMissed(req.params.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Mark missed error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark token as missed.' });
  }
};

const rejoinQueue = async (req, res) => {
  try {
    const result = await tokenService.recoverRejoinQueue(req.params.id, req.user.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Rejoin queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to rejoin queue.' });
  }
};

const recallRequest = async (req, res) => {
  try {
    const result = await tokenService.recoverRecallRequest(req.params.id, req.user.id, getIo(req));
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Recall request error:', error);
    res.status(500).json({ success: false, message: 'Failed to request recall.' });
  }
};

module.exports = {
  bookToken,
  getMyTokens,
  getTokenHistory,
  cancelToken,
  getQueueTokens,
  callToken,
  serveToken,
  completeToken,
  skipToken,
  setPriority,
  callNextToken,
  markMissed,
  rejoinQueue,
  recallRequest,
};
