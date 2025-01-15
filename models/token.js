const db = require('../config/db');

async function saveRefreshToken(userId, refreshToken) {
  try {
    const [result] = await db.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
      [userId, refreshToken]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error saving refresh token:', error);
    throw error;
  }
}

async function deleteRefreshToken(token) {
  try {
    const [result] = await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting refresh token:', error);
    throw error;
  }
}

async function findRefreshToken(token) {
  try {
    const [rows] = await db.query('SELECT * FROM refresh_tokens WHERE token = ?', [token]);
    return rows[0];
  } catch (error) {
    console.error('Error finding refresh token:', error);
    throw error;
  }
}

async function cleanupOldTokens() {
  try {
    const [result] = await db.query(
      'DELETE FROM refresh_tokens WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up old tokens:', error);
    throw error;
  }
}

module.exports = {
  saveRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  cleanupOldTokens
}; 