const db = require('../config/db');

async function createPost(user_id, title, short_description, content) {
  try {
    const [result] = await db.query(
      'INSERT INTO posts (user_id, title, short_description, content) VALUES (?, ?, ?, ?)',
      [user_id, title, short_description, content]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

async function getPostById(id) {
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error getting post by id:', error);
    throw error;
  }
}

async function getPostsByUserId(userId) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM posts WHERE user_id = ?',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting posts by user ID:', error);
    throw error;
  }
}

async function incrementViews(id) {
  try {
    const [result] = await db.query(
      'UPDATE posts SET views = views + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error incrementing views:', error);
    throw error;
  }
}

async function updatePost(id, title, short_description, content) {
  try {
    const [result] = await db.query(
      'UPDATE posts SET title = ?, short_description = ?, content = ? WHERE id = ?',
      [title, short_description, content, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

async function deletePost(id) {
  try {
    const [result] = await db.query('DELETE FROM posts WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

async function getAllPosts() {
  try {
    const [rows] = await db.query(`
      SELECT 
        posts.*,
        users.username,
        users.avatar_url
      FROM posts 
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.publication_date DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error getting all posts:', error);
    throw error;
  }
}

module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  incrementViews,
  updatePost,
  deletePost,
  getAllPosts
};