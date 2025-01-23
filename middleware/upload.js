const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('[UPLOAD MIDDLEWARE] File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    headers: file.headers,
    encoding: file.encoding
  });

  if (!file.mimetype.startsWith('image/')) {
    console.log('[UPLOAD MIDDLEWARE] File validation failed - invalid mime type:', file.mimetype);
    return cb(new Error('Only image files are allowed'), false);
  }

  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    console.log('[UPLOAD MIDDLEWARE] File validation failed - invalid extension:', file.originalname);
    return cb(new Error('Only jpg, jpeg, png and gif files are allowed'), false);
  }

  console.log('[UPLOAD MIDDLEWARE] File validation passed');
  cb(null, true);
};

const uploadConfig = { 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // увеличим до 10MB
    fieldSize: 10 * 1024 * 1024, // увеличим до 10MB
    files: 1
  }
};

// Middleware for avatar upload
const uploadAvatar = multer(uploadConfig).single('avatar');

// Middleware for featured image upload
const uploadFeaturedImage = multer(uploadConfig).single('featured_image');

// Middleware for content image upload
const uploadContentImage = multer(uploadConfig).single('content_image');

// Creating wrapper middleware for error handling
const handleUploadError = (req, res, next, uploadFn, isOptional = false) => {
  console.log('[UPLOAD MIDDLEWARE] Starting upload process:', {
    url: req.url,
    method: req.method,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    boundary: req.headers['content-type'] ? req.headers['content-type'].split('boundary=')[1] : 'no boundary'
  });
  
  // Set a timeout for the upload
  const uploadTimeout = setTimeout(() => {
    console.error('[UPLOAD MIDDLEWARE] Upload timeout reached');
    if (!res.headersSent) {
      res.status(408).json({
        message: 'Upload timeout reached',
        code: 'UPLOAD_TIMEOUT'
      });
    }
  }, 25000);

  uploadFn(req, res, function (err) {
    console.log('[UPLOAD MIDDLEWARE] Multer processing completed');
    clearTimeout(uploadTimeout);

    if (err instanceof multer.MulterError) {
      console.error('[UPLOAD MIDDLEWARE] Multer error:', {
        code: err.code,
        field: err.field,
        message: err.message,
        stack: err.stack,
        type: 'MulterError'
      });
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'File too large',
          error: 'Maximum file size is 10MB',
          code: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message,
        code: 'MULTER_ERROR'
      });
    } else if (err) {
      console.error('[UPLOAD MIDDLEWARE] General upload error:', {
        message: err.message,
        stack: err.stack,
        type: err.constructor.name
      });
      return res.status(400).json({
        message: 'File upload failed',
        error: err.message,
        code: 'UPLOAD_ERROR'
      });
    }
    
    if (!req.file && !isOptional) {
      console.error('[UPLOAD MIDDLEWARE] No file in request', {
        headers: req.headers,
        body: Object.keys(req.body || {})
      });
      return res.status(400).json({
        message: 'Please upload a file',
        code: 'NO_FILE'
      });
    }
    
    if (req.file) {
      console.log('[UPLOAD MIDDLEWARE] File upload successful:', {
        fieldname: req.file.fieldname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        bufferLength: req.file.buffer ? req.file.buffer.length : 0
      });
    }
    
    console.log('[UPLOAD MIDDLEWARE] Proceeding to next middleware');
    next();
  });
};

const wrapUploadMiddleware = (uploadFn, isOptional = false) => {
  return (req, res, next) => handleUploadError(req, res, next, uploadFn, isOptional);
};

module.exports = {
  uploadAvatar: wrapUploadMiddleware(uploadAvatar, true),
  uploadFeaturedImage: wrapUploadMiddleware(uploadFeaturedImage),
  uploadContentImage: wrapUploadMiddleware(uploadContentImage)
}; 