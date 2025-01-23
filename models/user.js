const db = require('../config/db');
const bcrypt = require('bcrypt');

async function createUser(username, email, password, avatar_url) {
  try {
    const defaultAvatar = `https://res.cloudinary.com/dxpusp7zw/image/upload/fl_preserve_transparency/v1737639376/post_content_images/f7mkiigoysg5h1yrfvif.jpg?_s=public-apps`;

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, avatar_url || defaultAvatar]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const [rows] = await db.query('SELECT id, username, avatar_url, registration_date, email FROM users WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const [rows] = await db.query('SELECT id, username, avatar_url, registration_date FROM users');
    return rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function updateUser(id, updates) {
  try {
    const setClause = Object.entries(updates)
      .map(([key, _]) => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(updates), id];

    const [result] = await db.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function updateUserPassword(id, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getAllUsers,
  updateUser,
  updateUserPassword
};