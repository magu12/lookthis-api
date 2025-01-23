const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('Received file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  if (!file.mimetype.startsWith('image/')) {
    console.log('File validation failed - invalid mime type:', file.mimetype);
    return cb(new Error('Only image files are allowed'), false);
  }

  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    console.log('File validation failed - invalid extension:', file.originalname);
    return cb(new Error('Only jpg, jpeg, png and gif files are allowed'), false);
  }

  console.log('File validation passed');
  cb(null, true);
};

const uploadConfig = { 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
    fieldSize: 5 * 1024 * 1024 // 5MB max field size
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
  console.log('Starting file upload process');
  
  // Set a timeout for the upload - reduced to 25 seconds to give buffer for Heroku's 30s limit
  const uploadTimeout = setTimeout(() => {
    console.error('Upload timeout reached');
    res.status(408).json({
      message: 'Upload timeout reached',
      code: 'UPLOAD_TIMEOUT'
    });
  }, 25000);

  uploadFn(req, res, function (err) {
    // Clear the timeout since upload completed (either success or error)
    clearTimeout(uploadTimeout);

    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'File too large',
          error: 'Maximum file size is 5MB',
          code: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message,
        code: 'MULTER_ERROR'
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        message: 'File upload failed',
        error: err.message,
        code: 'UPLOAD_ERROR'
      });
    }
    
    if (!req.file && !isOptional) {
      console.error('No file in request');
      return res.status(400).json({
        message: 'Please upload a file',
        code: 'NO_FILE'
      });
    }
    
    console.log('File upload middleware completed successfully');
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