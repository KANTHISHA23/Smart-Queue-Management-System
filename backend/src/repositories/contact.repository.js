const { query } = require('../config/db');

class ContactRepository {
  /**
   * Create a new contact query
   */
  async create(contactData) {
    const { name, email, subject, message } = contactData;
    const result = await query(
      `INSERT INTO contact_queries (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, subject, message]
    );
    return result.rows[0];
  }

  /**
   * Get all contact queries
   */
  async findAll() {
    const result = await query(
      `SELECT * FROM contact_queries ORDER BY created_at DESC`
    );
    return result.rows;
  }

  /**
   * Update the status of a query
   */
  async updateStatus(id, status) {
    const result = await query(
      `UPDATE contact_queries 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  /**
   * Delete a query
   */
  async delete(id) {
    const result = await query(
      `DELETE FROM contact_queries WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find query by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT * FROM contact_queries WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new ContactRepository();
