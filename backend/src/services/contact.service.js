const contactRepository = require('../repositories/contact.repository');

class ContactService {
  /**
   * Process and save a new contact query
   */
  async createContact(contactData, io) {
    // Basic validation
    if (!contactData.name || !contactData.email || !contactData.message) {
      throw new Error('Name, email, and message are required fields.');
    }

    const savedQuery = await contactRepository.create(contactData);

    // Optionally emit event for realtime admin panel updates if Socket.IO is provided
    if (io) {
      io.emit('new_contact_query', savedQuery);
    }

    return savedQuery;
  }

  /**
   * Retrieve all contact queries
   */
  async getAllQueries() {
    return await contactRepository.findAll();
  }

  /**
   * Update the status of an existing query
   */
  async updateQueryStatus(id, newStatus, io) {
    if (!['pending', 'resolved'].includes(newStatus)) {
      throw new Error('Invalid status. Must be "pending" or "resolved".');
    }

    const queryInfo = await contactRepository.findById(id);
    if (!queryInfo) {
      throw new Error('Query not found.');
    }

    const updatedQuery = await contactRepository.updateStatus(id, newStatus);
    
    if (io) {
      io.emit('contact_query_updated', updatedQuery);
    }

    return updatedQuery;
  }

  /**
   * Delete a contact query
   */
  async deleteQuery(id, io) {
    const queryInfo = await contactRepository.findById(id);
    if (!queryInfo) {
      throw new Error('Query not found.');
    }

    const deletedQuery = await contactRepository.delete(id);

    if (io) {
      io.emit('contact_query_deleted', { id });
    }

    return deletedQuery;
  }
}

module.exports = new ContactService();
