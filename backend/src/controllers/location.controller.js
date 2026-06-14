/**
 * Location Controller — HTTP adapter only
 */
const locationService = require('../services/location.service');

const getLocations = async (req, res) => {
  try {
    const result = await locationService.getLocations(req.query);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locations.' });
  }
};

const getLocationById = async (req, res) => {
  try {
    const result = await locationService.getLocationById(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch location.' });
  }
};

const createLocation = async (req, res) => {
  try {
    const adminId = req.user.role === 'admin' ? req.user.id : null;
    const result = await locationService.createLocation(req.body, adminId);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.status(result.status).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ success: false, message: 'Failed to create location.' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const result = await locationService.updateLocation(req.params.id, req.body);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location.' });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const result = await locationService.deleteLocation(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete location.' });
  }
};

module.exports = { getLocations, getLocationById, createLocation, updateLocation, deleteLocation };
