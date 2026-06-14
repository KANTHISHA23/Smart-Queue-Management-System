/**
 * User repository — auth-related persistence
 */
const { query } = require('../config/db');

const findIdByEmail = (email) =>
  query('SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);

const insertUser = (name, email, passwordHash, phone) =>
  query(
    `INSERT INTO users (name, email, password_hash, phone, role) 
     VALUES ($1, $2, $3, $4, 'user') 
     RETURNING id, name, email, phone, role, created_at`,
    [name, email, passwordHash, phone || null]
  );

const findByEmailForLogin = (email) =>
  query(
    'SELECT id, name, email, password_hash, phone, role, avatar_url, is_active FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
    [email]
  );

const findByIdForRefresh = (id) =>
  query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [id]);

const findProfileById = (id) =>
  query(`SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = $1`, [id]);

const updateProfile = (name, phone, userId) =>
  query(
    `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, email, phone, role, avatar_url`,
    [name, phone, userId]
  );

const updateAvatarUrl = (avatarUrl, userId) =>
  query(
    `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, name, email, phone, role, avatar_url, created_at`,
    [avatarUrl, userId]
  );

const findAvatarUrlById = (userId) =>
  query(`SELECT avatar_url FROM users WHERE id = $1`, [userId]);

module.exports = {
  findIdByEmail,
  insertUser,
  findByEmailForLogin,
  findByIdForRefresh,
  findProfileById,
  updateProfile,
  updateAvatarUrl,
  findAvatarUrlById,
};
