/**
 * Queue Controller — HTTP adapter only
 */
const queueService = require('../services/queue.service');

const getActiveQueues = async (req, res) => {
  try {
    const result = await queueService.getActiveQueues();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get active queues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queues.' });
  }
};

const getQueueById = async (req, res) => {
  try {
    const result = await queueService.getQueueById(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue.' });
  }
};

const createQueue = async (req, res) => {
  try {
    const result = await queueService.createQueue(req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.status(result.status).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to create queue.' });
  }
};

const updateQueue = async (req, res) => {
  try {
    const result = await queueService.updateQueue(req.params.id, req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Update queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to update queue.' });
  }
};

const deleteQueue = async (req, res) => {
  try {
    const result = await queueService.deleteQueue(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Delete queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete queue.' });
  }
};

const resetQueue = async (req, res) => {
  try {
    const result = await queueService.resetQueue(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Reset queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset queue.' });
  }
};

module.exports = { getActiveQueues, getQueueById, createQueue, updateQueue, deleteQueue, resetQueue };

