/**
 * Location Routes
 */
const express = require('express');
const router = express.Router();
const { getLocations, getLocationById, createLocation, updateLocation, deleteLocation } = require('../controllers/location.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const createLocationSchema = {
  name: { required: true, type: 'string', min: 2, message: 'Location name is required.' },
  type: { required: true, type: 'string', enum: ['hospital', 'clinic', 'office', 'bank', 'government'], message: 'Valid type is required.' }
};

// Public routes
router.get('/', getLocations);
router.get('/:id', getLocationById);

// Admin & Organization routes
router.post('/', authenticate, requireRole('admin', 'organization'), validate(createLocationSchema), createLocation);
router.put('/:id', authenticate, requireRole('admin'), updateLocation);
router.delete('/:id', authenticate, requireRole('admin'), deleteLocation);

module.exports = router;
