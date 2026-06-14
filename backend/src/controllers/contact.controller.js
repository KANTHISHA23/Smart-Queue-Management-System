const contactService = require('../services/contact.service');

/**
 * Submit a new contact query
 * Method: POST
 * Route: /api/contact
 */
const submitQuery = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { name, email, subject, message } = req.body;

    const savedQuery = await contactService.createContact({ name, email, subject, message }, io);

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: savedQuery,
    });
  } catch (error) {
    console.error('Submit query error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit query.',
    });
  }
};

/**
 * Get all contact queries
 * Method: GET
 * Route: /api/admin/queries
 */
const getQueries = async (req, res) => {
  try {
    const queries = await contactService.getAllQueries();

    res.status(200).json({
      success: true,
      data: queries,
    });
  } catch (error) {
    console.error('Get queries error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queries.',
    });
  }
};

/**
 * Update a contact query status
 * Method: PATCH
 * Route: /api/admin/queries/:id
 */
const updateStatus = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { id } = req.params;
    const { status } = req.body;

    const updatedQuery = await contactService.updateQueryStatus(id, status, io);

    res.status(200).json({
      success: true,
      message: 'Query status updated successfully',
      data: updatedQuery,
    });
  } catch (error) {
    console.error('Update query error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update query.',
    });
  }
};

/**
 * Delete a contact query
 * Method: DELETE
 * Route: /api/admin/queries/:id
 */
const deleteQuery = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { id } = req.params;

    const deletedQuery = await contactService.deleteQuery(id, io);

    res.status(200).json({
      success: true,
      message: 'Query deleted successfully',
      data: deletedQuery,
    });
  } catch (error) {
    console.error('Delete query error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete query.',
    });
  }
};

module.exports = {
  submitQuery,
  getQueries,
  updateStatus,
  deleteQuery,
};
