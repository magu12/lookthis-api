const db = require('../config/database');

const createPost = async (user_id, title, short_description, content, featured_image_url = null) => {
  console.log('[POST MODEL] Starting database transaction for post creation:', {
    userId: user_id,
    titleLength: title.length,
    descriptionLength: short_description.length,
    contentLength: content.length,
    hasFeaturedImage: !!featured_image_url,
    timestamp: new Date().toISOString(),
    sql: 'INSERT INTO posts (user_id, title, short_description, content, featured_image_url) VALUES (?, ?, ?, ?, ?)'
  });

  try {
    const [result] = await db.query(
      'INSERT INTO posts (user_id, title, short_description, content, featured_image_url) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, short_description, content, featured_image_url]
    );

    console.log('[POST MODEL] ✅ Post created successfully:', {
      postId: result.insertId,
      affectedRows: result.affectedRows,
      timestamp: new Date().toISOString()
    });

    return result.insertId;
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error during post creation:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      },
      params: {
        userId: user_id,
        titleLength: title.length,
        descriptionLength: short_description.length,
        contentLength: content.length,
        hasFeaturedImage: !!featured_image_url
      },
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const getPostById = async (postId) => {
  console.log('[POST MODEL] Fetching post by ID:', {
    postId,
    timestamp: new Date().toISOString(),
    sql: `SELECT p.*, u.username, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`
  });

  try {
    const [rows] = await db.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [postId]
    );

    console.log('[POST MODEL] Post fetch result:', {
      found: rows.length > 0,
      timestamp: new Date().toISOString()
    });

    return rows[0];
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error fetching post:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      },
      postId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const getPostsByUserId = async (userId) => {
  console.log('[POST MODEL] Fetching posts by user ID:', {
    userId,
    timestamp: new Date().toISOString(),
    sql: `SELECT p.*, u.username, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.publication_date DESC`
  });

  try {
    const [rows] = await db.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = ?
       ORDER BY p.publication_date DESC`,
      [userId]
    );

    console.log('[POST MODEL] User posts fetch result:', {
      count: rows.length,
      timestamp: new Date().toISOString()
    });

    return rows;
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error fetching user posts:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      },
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const getAllPosts = async () => {
  const sql = `SELECT p.*, u.username, u.avatar_url 
               FROM posts p 
               JOIN users u ON p.user_id = u.id 
               ORDER BY p.publication_date DESC`;

  console.log('[POST MODEL] Fetching all posts:', {
    timestamp: new Date().toISOString(),
    sql
  });

  try {
    const [rows] = await db.query(sql);

    console.log('[POST MODEL] All posts fetch result:', {
      count: rows.length,
      timestamp: new Date().toISOString()
    });

    return rows;
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error fetching all posts:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      },
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const incrementViews = async (postId) => {
  console.log('[POST MODEL] Incrementing post views:', {
    postId,
    timestamp: new Date().toISOString(),
    sql: 'UPDATE posts SET views = views + 1 WHERE id = ?'
  });

  try {
    const [result] = await db.query(
      'UPDATE posts SET views = views + 1 WHERE id = ?',
      [postId]
    );

    console.log('[POST MODEL] ✅ View increment result:', {
      affectedRows: result.affectedRows,
      timestamp: new Date().toISOString()
    });

    return result.affectedRows > 0;
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error incrementing views:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      },
      postId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const updatePost = async (postId, title, short_description, content, featured_image_url = null) => {
  console.log('[POST MODEL] Starting post update:', {
    postId,
    titleLength: title.length,
    descriptionLength: short_description.length,
    contentLength: content.length,
    hasFeaturedImage: !!featured_image_url,
    timestamp: new Date().toISOString(),
    sql: 'UPDATE posts SET title = ?, short_description = ?, content = ?, featured_image_url = ? WHERE id = ?'
  });

  try {
    const [result] = await db.query(
      'UPDATE posts SET title = ?, short_description = ?, content = ?, featured_image_url = ? WHERE id = ?',
      [title, short_description, content, featured_image_url, postId]
    );

    console.log('[POST MODEL] ✅ Post update result:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      timestamp: new Date().toISOString()
    });

    return result.affectedRows > 0;
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error updating post:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      },
      params: {
        postId,
        titleLength: title.length,
        descriptionLength: short_description.length,
        contentLength: content.length,
        hasFeaturedImage: !!featured_image_url
      },
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const deletePost = async (postId) => {
  console.log('[POST MODEL] Starting post deletion:', {
    postId,
    timestamp: new Date().toISOString(),
    sql: 'DELETE FROM posts WHERE id = ?'
  });

  try {
    const [result] = await db.query('DELETE FROM posts WHERE id = ?', [postId]);

    console.log('[POST MODEL] ✅ Post deletion result:', {
      affectedRows: result.affectedRows,
      timestamp: new Date().toISOString()
    });

    return result.affectedRows > 0;
  } catch (error) {
    console.error('[POST MODEL] ❌ Database error deleting post:', {
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      },
      postId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  incrementViews,
  updatePost,
  deletePost,
  getAllPosts
};