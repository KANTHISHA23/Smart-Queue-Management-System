/**
 * Organization Queue Controller — HTTP adapter only (multi-tenant)
 * Providers can create, edit, delete, reset queues but CANNOT activate/deactivate.
 */
const queueService = require('../services/queue.service');
const { emitQueueCreated, emitQueueDeleted } = require('../socket/queue.socket');

const getIo = (req) => req.app.get('io');

const listMyQueues = async (req, res) => {
  try {
    const result = await queueService.getOrganizationQueues(req.organizationId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Org list queues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queues.' });
  }
};

const createQueue = async (req, res) => {
  try {
    const result = await queueService.createQueueForOrganization(req.organizationId, req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });

    // Emit to admin room — admin sees new pending queue
    emitQueueCreated(getIo(req), result.data);

    res.status(result.status).json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org create queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to create queue.' });
  }
};

const updateQueue = async (req, res) => {
  try {
    const result = await queueService.updateQueueForOrganization(req.organizationId, req.params.id, req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Org update queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to update queue.' });
  }
};

const deleteQueue = async (req, res) => {
  try {
    const result = await queueService.deleteQueueForOrganization(req.organizationId, req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });

    // Emit to admin + global — queue removed
    emitQueueDeleted(getIo(req), { id: req.params.id, organization_id: req.organizationId });

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Org delete queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete queue.' });
  }
};

const resetQueue = async (req, res) => {
  try {
    const result = await queueService.resetQueueForOrganization(req.organizationId, req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Org reset queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset queue.' });
  }
};

module.exports = { listMyQueues, createQueue, updateQueue, deleteQueue, resetQueue };
