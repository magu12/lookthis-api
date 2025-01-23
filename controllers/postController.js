const postModel = require('../models/post');
const cloudinary = require('../config/cloudinary');
const sanitizeHtml = require('sanitize-html');
const { Readable } = require('stream');

// Конфигурация для sanitize-html
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id', 'style']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/]
    }
  }
};

/**
 * Загружает изображение в Cloudinary
 * @param {Buffer} buffer - Буфер с данными изображения
 * @param {string} mimeType - MIME-тип изображения
 * @param {string} folder - Папка в Cloudinary
 * @returns {Promise<string>} URL загруженного изображения
 */
async function uploadToCloudinary(buffer, mimeType, folder) {
  try {
    console.log('[CLOUDINARY] Starting upload:', {
      mimeType,
      folder,
      bufferSize: buffer.length,
      bufferValid: Buffer.isBuffer(buffer)
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          quality: 'auto:good',
          fetch_format: 'auto',
          flags: 'lossy',
          transformation: [
            { width: 2000, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' }
          ],
          timeout: 10000
        },
        (error, result) => {
          if (error) {
            console.error('[CLOUDINARY] Upload stream error:', error);
            reject(error);
            return;
          }
          console.log('[CLOUDINARY] Upload successful:', {
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            url: result.secure_url
          });
          resolve(result.secure_url);
        }
      );

      // Create a readable stream from buffer
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      // Pipe it to the upload stream
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('[CLOUDINARY] Upload error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      details: error.http_code ? {
        http_code: error.http_code,
        error_info: error.error?.message
      } : undefined
    });
    throw error;
  }
}

// Обработчик загрузки изображений для контента
const uploadContentImage = async (req, res) => {
  try {
    console.log('[CONTENT UPLOAD] Request received:', {
      headers: req.headers,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        bufferLength: req.file.buffer ? req.file.buffer.length : 0
      } : 'No file'
    });

    if (!req.file) {
      console.error('[CONTENT UPLOAD] No file in request');
      return res.status(400).json({ 
        message: 'No image file provided',
        error: 'FILE_MISSING'
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('[CONTENT UPLOAD] Empty file buffer', {
        file: req.file
      });
      return res.status(400).json({ 
        message: 'Empty file provided',
        error: 'EMPTY_FILE'
      });
    }

    console.log('[CONTENT UPLOAD] Starting Cloudinary upload...', {
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname
    });

    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      'post_content_images'
    );

    console.log('[CONTENT UPLOAD] Cloudinary upload successful:', {
      url: imageUrl,
      originalName: req.file.originalname
    });

    res.status(200).json({ 
      url: imageUrl,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('[CONTENT UPLOAD] Error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      cloudinaryError: error.http_code ? {
        code: error.http_code,
        message: error.error?.message
      } : undefined
    });
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({ 
        message: 'Upload timeout',
        error: 'UPLOAD_TIMEOUT'
      });
    }

    if (error.http_code) {
      return res.status(error.http_code).json({
        message: 'Cloudinary error',
        error: error.message
      });
    }

    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, short_description, content } = req.body;
    const user_id = req.user.userId;
    
    if (!user_id || !title || !short_description || !content) {
      return res.status(400).json({ message: 'User ID, title, short description, and content are required' });
    }

    // Санитизация HTML
    const sanitizedContent = sanitizeHtml(content, sanitizeOptions);

    let featured_image_url = null;
    if (req.file) {
      featured_image_url = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        'featured_images'
      );
    }

    const postId = await postModel.createPost(user_id, title, short_description, sanitizedContent, featured_image_url);
    res.status(201).json({ message: 'Post created successfully', postId });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await postModel.incrementViews(postId);
    const updatedPost = await postModel.getPostById(postId);
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error getting post by ID:', error);
    res.status(500).json({ message: 'Failed to get post by ID' });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    const { title, short_description, content } = req.body;

    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ message: 'You can only update your own posts' });
    }

    // Санитизация HTML
    const sanitizedContent = sanitizeHtml(content, sanitizeOptions);

    let featured_image_url = post.featured_image_url;
    if (req.file) {
      featured_image_url = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        'featured_images'
      );
    }

    const updated = await postModel.updatePost(postId, title, short_description, sanitizedContent, featured_image_url);
    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userIdFromToken = req.user.userId;
    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== userIdFromToken) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    const deleted = await postModel.deletePost(postId);
    if (deleted) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found or not deleted' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await postModel.getPostsByUserId(userId);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error getting posts by user ID:', error);
    res.status(500).json({ message: 'Failed to get posts by user ID' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await postModel.getAllPosts();
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error getting all posts:', error);
    res.status(500).json({ message: 'Failed to get posts' });
  }
};

module.exports = {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getPostsByUserId,
  getAllPosts,
  uploadContentImage
};