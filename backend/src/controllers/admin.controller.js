/**
 * Admin Controller — Queue governance (activate/deactivate)
 * Only accessible to users with role = 'admin'
 */
const queueService = require('../services/queue.service');
const { emitQueueActivated, emitQueueDeactivated, emitQueueCreated } = require('../socket/queue.socket');

const getIo = (req) => req.app.get('io');

const getAllQueues = async (req, res) => {
  try {
    const result = await queueService.getAllQueuesAdmin();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Admin get all queues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queues.' });
  }
};

const activateQueue = async (req, res) => {
  try {
    const result = await queueService.activateQueue(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });

    // Emit real-time: all users should see the new active queue
    emitQueueActivated(getIo(req), result.data);

    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Admin activate queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate queue.' });
  }
};

const deactivateQueue = async (req, res) => {
  try {
    const result = await queueService.deactivateQueue(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });

    // Emit real-time: all users should remove this queue from view
    emitQueueDeactivated(getIo(req), result.data);

    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Admin deactivate queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate queue.' });
  }
};

module.exports = { getAllQueues, activateQueue, deactivateQueue };
