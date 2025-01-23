const multer = require('multer');

// Создаем хранилище в памяти с логированием
const storage = multer.memoryStorage();
console.log('[MULTER CONFIG] Memory storage initialized');

const fileFilter = (req, file, cb) => {
  console.log('\n[UPLOAD MIDDLEWARE] ====== NEW FILE FILTER CHECK ======');
  console.log('[UPLOAD MIDDLEWARE] Request headers:', req.headers);
  console.log('[UPLOAD MIDDLEWARE] File details:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    headers: file.headers,
    encoding: file.encoding,
    raw: file
  });

  if (!file.mimetype.startsWith('image/')) {
    console.log('[UPLOAD MIDDLEWARE] ❌ File validation failed - invalid mime type:', file.mimetype);
    return cb(new Error('Only image files are allowed'), false);
  }

  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    console.log('[UPLOAD MIDDLEWARE] ❌ File validation failed - invalid extension:', file.originalname);
    return cb(new Error('Only jpg, jpeg, png, gif and webp files are allowed'), false);
  }

  console.log('[UPLOAD MIDDLEWARE] ✅ File validation passed');
  cb(null, true);
};

const uploadConfig = { 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 10 * 1024 * 1024, // 10MB
    files: 1,
    parts: 2 // fieldname + file
  }
};

console.log('[MULTER CONFIG] Upload config:', {
  limits: uploadConfig.limits,
  storage: 'memoryStorage'
});

// Middleware for avatar upload
const uploadAvatar = multer(uploadConfig).single('avatar');
const uploadFeaturedImage = multer(uploadConfig).single('featured_image');
const uploadContentImage = multer(uploadConfig).single('content_image');

// Creating wrapper middleware for error handling
const handleUploadError = (req, res, next, uploadFn, isOptional = false) => {
  let uploadFinished = false;
  let uploadStartTime = Date.now();

  console.log('\n[UPLOAD MIDDLEWARE] ====== STARTING NEW UPLOAD ======');
  console.log('[UPLOAD MIDDLEWARE] Request details:', {
    url: req.url,
    method: req.method,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    boundary: req.headers['content-type'] ? req.headers['content-type'].split('boundary=')[1] : 'no boundary',
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    allHeaders: req.headers
  });
  
  // Set a timeout for the upload
  const uploadTimeout = setTimeout(() => {
    if (!uploadFinished) {
      console.error('[UPLOAD MIDDLEWARE] ⚠️ Upload timeout reached after', Date.now() - uploadStartTime, 'ms');
      if (!res.headersSent) {
        res.status(408).json({
          message: 'Upload timeout reached',
          code: 'UPLOAD_TIMEOUT',
          timeElapsed: Date.now() - uploadStartTime
        });
      }
    }
  }, 10000);

  uploadFn(req, res, function (err) {
    uploadFinished = true;
    const timeElapsed = Date.now() - uploadStartTime;
    console.log(`[UPLOAD MIDDLEWARE] Multer processing completed in ${timeElapsed}ms`);
    clearTimeout(uploadTimeout);

    if (err instanceof multer.MulterError) {
      console.error('[UPLOAD MIDDLEWARE] ❌ Multer error:', {
        code: err.code,
        field: err.field,
        message: err.message,
        stack: err.stack,
        type: 'MulterError',
        timeElapsed
      });
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'File too large',
          error: 'Maximum file size is 10MB',
          code: 'FILE_TOO_LARGE',
          timeElapsed
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message,
        code: 'MULTER_ERROR',
        timeElapsed
      });
    } else if (err) {
      console.error('[UPLOAD MIDDLEWARE] ❌ General upload error:', {
        message: err.message,
        stack: err.stack,
        type: err.constructor.name,
        timeElapsed
      });
      return res.status(400).json({
        message: 'File upload failed',
        error: err.message,
        code: 'UPLOAD_ERROR',
        timeElapsed
      });
    }
    
    if (!req.file && !isOptional) {
      console.error('[UPLOAD MIDDLEWARE] ❌ No file in request', {
        headers: req.headers,
        body: Object.keys(req.body || {}),
        timeElapsed
      });
      return res.status(400).json({
        message: 'Please upload a file',
        code: 'NO_FILE',
        timeElapsed
      });
    }
    
    if (req.file) {
      console.log('[UPLOAD MIDDLEWARE] ✅ File upload successful:', {
        fieldname: req.file.fieldname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        bufferLength: req.file.buffer ? req.file.buffer.length : 0,
        timeElapsed
      });
    }
    
    console.log('[UPLOAD MIDDLEWARE] ➡️ Proceeding to next middleware');
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