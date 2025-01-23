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
  const startTime = Date.now();
  console.log('\n[CLOUDINARY] ====== STARTING CLOUDINARY UPLOAD ======');
  
  try {
    console.log('[CLOUDINARY] Upload parameters:', {
      mimeType,
      folder,
      bufferSize: buffer.length,
      bufferValid: Buffer.isBuffer(buffer),
      startTime: new Date(startTime).toISOString()
    });

    return new Promise((resolve, reject) => {
      console.log('[CLOUDINARY] Creating upload stream...');
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          quality: 'auto:good',
          fetch_format: 'auto',
          flags: 'lossy',
          chunk_size: 6000000, // 6MB chunks
          transformation: [
            { width: 2000, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          const uploadDuration = Date.now() - startTime;
          
          if (error) {
            console.error('[CLOUDINARY] ❌ Upload stream error:', {
              error,
              duration: uploadDuration,
              errorDetails: {
                message: error.message,
                name: error.name,
                http_code: error.http_code,
                stack: error.stack
              }
            });
            reject(error);
            return;
          }

          console.log('[CLOUDINARY] ✅ Upload successful:', {
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
            url: result.secure_url,
            duration: uploadDuration
          });
          resolve(result.secure_url);
        }
      );

      console.log('[CLOUDINARY] Upload stream created, setting up data stream...');

      // Create a readable stream from buffer and handle errors
      const stream = new Readable({
        read() {
          console.log('[CLOUDINARY] Stream read called, pushing buffer...');
          this.push(buffer);
          this.push(null);
          console.log('[CLOUDINARY] Buffer pushed to stream');
        }
      });

      stream.on('error', (error) => {
        console.error('[CLOUDINARY] ❌ Stream error:', {
          error,
          duration: Date.now() - startTime,
          errorDetails: {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        });
        reject(error);
      });

      uploadStream.on('error', (error) => {
        console.error('[CLOUDINARY] ❌ Upload stream error:', {
          error,
          duration: Date.now() - startTime,
          errorDetails: {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        });
        reject(error);
      });

      uploadStream.on('end', () => {
        console.log('[CLOUDINARY] Upload stream ended after', Date.now() - startTime, 'ms');
      });

      uploadStream.on('data', (data) => {
        console.log('[CLOUDINARY] Received data chunk:', {
          chunkSize: data.length,
          timeElapsed: Date.now() - startTime
        });
      });

      console.log('[CLOUDINARY] Starting pipe operation...');
      // Pipe it to the upload stream with error handling
      stream.pipe(uploadStream)
        .on('error', (error) => {
          console.error('[CLOUDINARY] ❌ Pipe error:', {
            error,
            duration: Date.now() - startTime,
            errorDetails: {
              message: error.message,
              name: error.name,
              stack: error.stack
            }
          });
          reject(error);
        });
      console.log('[CLOUDINARY] Pipe operation started');
    });
  } catch (error) {
    console.error('[CLOUDINARY] ❌ Upload error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      duration: Date.now() - startTime,
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
  const startTime = Date.now();
  console.log('\n[CONTENT UPLOAD] ====== STARTING CONTENT IMAGE UPLOAD ======');
  
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
      } : 'No file',
      startTime: new Date(startTime).toISOString()
    });

    if (!req.file) {
      console.error('[CONTENT UPLOAD] ❌ No file in request');
      return res.status(400).json({ 
        message: 'No image file provided',
        error: 'FILE_MISSING',
        timeElapsed: Date.now() - startTime
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('[CONTENT UPLOAD] ❌ Empty file buffer', {
        file: req.file,
        timeElapsed: Date.now() - startTime
      });
      return res.status(400).json({ 
        message: 'Empty file provided',
        error: 'EMPTY_FILE',
        timeElapsed: Date.now() - startTime
      });
    }

    console.log('[CONTENT UPLOAD] Starting Cloudinary upload...', {
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      timeElapsed: Date.now() - startTime
    });

    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      'post_content_images'
    );

    console.log('[CONTENT UPLOAD] ✅ Cloudinary upload successful:', {
      url: imageUrl,
      originalName: req.file.originalname,
      timeElapsed: Date.now() - startTime
    });

    res.status(200).json({ 
      url: imageUrl,
      originalName: req.file.originalname,
      timeElapsed: Date.now() - startTime
    });
  } catch (error) {
    console.error('[CONTENT UPLOAD] ❌ Error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      timeElapsed: Date.now() - startTime,
      cloudinaryError: error.http_code ? {
        code: error.http_code,
        message: error.error?.message
      } : undefined
    });
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({ 
        message: 'Upload timeout',
        error: 'UPLOAD_TIMEOUT',
        timeElapsed: Date.now() - startTime
      });
    }

    if (error.http_code) {
      return res.status(error.http_code).json({
        message: 'Cloudinary error',
        error: error.message,
        timeElapsed: Date.now() - startTime
      });
    }

    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message,
      timeElapsed: Date.now() - startTime
    });
  }
};

const createPost = async (req, res) => {
  const startTime = Date.now();
  console.log('\n[CREATE POST] ====== STARTING POST CREATION ======');
  
  try {
    console.log('[CREATE POST] Request received:', {
      headers: {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        authorization: req.headers.authorization ? 'Present' : 'Missing'
      },
      body: {
        hasTitle: !!req.body.title,
        hasDescription: !!req.body.short_description,
        contentLength: req.body.content?.length,
        userId: req.user?.userId
      },
      file: req.file ? {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname
      } : 'No file',
      startTime: new Date(startTime).toISOString()
    });

    const { title, short_description, content } = req.body;
    const user_id = req.user.userId;
    
    // Validate required fields
    if (!user_id || !title || !short_description || !content) {
      console.error('[CREATE POST] ❌ Validation failed:', {
        hasUserId: !!user_id,
        hasTitle: !!title,
        hasDescription: !!short_description,
        hasContent: !!content,
        timeElapsed: Date.now() - startTime
      });
      return res.status(400).json({ 
        message: 'User ID, title, short description, and content are required',
        timeElapsed: Date.now() - startTime
      });
    }

    // Sanitize HTML with a timeout
    console.log('[CREATE POST] Starting HTML sanitization...', {
      contentLength: content.length,
      timeElapsed: Date.now() - startTime
    });

    const sanitizePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HTML sanitization timeout'));
      }, 30000); // 30 second timeout

      try {
        const sanitized = sanitizeHtml(content, sanitizeOptions);
        clearTimeout(timeout);
        resolve(sanitized);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });

    const sanitizedContent = await sanitizePromise;
    
    console.log('[CREATE POST] HTML sanitization complete', {
      originalLength: content.length,
      sanitizedLength: sanitizedContent.length,
      timeElapsed: Date.now() - startTime
    });

    // Handle featured image upload if present
    let featured_image_url = null;
    if (req.file) {
      console.log('[CREATE POST] Starting featured image upload...', {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        timeElapsed: Date.now() - startTime
      });

      try {
        featured_image_url = await uploadToCloudinary(
          req.file.buffer,
          req.file.mimetype,
          'featured_images'
        );

        console.log('[CREATE POST] Featured image upload complete:', {
          url: featured_image_url,
          timeElapsed: Date.now() - startTime
        });
      } catch (error) {
        console.error('[CREATE POST] ❌ Featured image upload failed:', {
          error: error.message,
          timeElapsed: Date.now() - startTime
        });
        // Continue without featured image if upload fails
      }
    }

    // Create post in database with timeout
    console.log('[CREATE POST] Creating post in database...', {
      titleLength: title.length,
      descriptionLength: short_description.length,
      contentLength: sanitizedContent.length,
      hasFeaturedImage: !!featured_image_url,
      userId: user_id,
      timeElapsed: Date.now() - startTime
    });

    const dbPromise = new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Database operation timeout'));
      }, 30000); // 30 second timeout

      try {
        const postId = await postModel.createPost(
          user_id, 
          title, 
          short_description, 
          sanitizedContent, 
          featured_image_url
        );
        clearTimeout(timeout);
        resolve(postId);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });

    const postId = await dbPromise;
    
    console.log('[CREATE POST] ✅ Post created successfully:', {
      postId,
      timeElapsed: Date.now() - startTime
    });

    res.status(201).json({ 
      message: 'Post created successfully', 
      postId,
      timeElapsed: Date.now() - startTime 
    });
  } catch (error) {
    console.error('[CREATE POST] ❌ Error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      timeElapsed: Date.now() - startTime,
      requestBody: {
        hasTitle: !!req.body?.title,
        hasDescription: !!req.body?.short_description,
        contentLength: req.body?.content?.length,
        hasFile: !!req.file
      }
    });

    // Send appropriate error response
    if (!res.headersSent) {
      const status = error.message.includes('timeout') ? 504 : 500;
      res.status(status).json({ 
        message: 'Failed to create post',
        error: error.message,
        timeElapsed: Date.now() - startTime
      });
    } else {
      console.error('[CREATE POST] ❌ Headers already sent, could not send error response');
    }
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