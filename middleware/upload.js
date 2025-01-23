const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    console.log('File validation passed:', file.originalname);
    cb(null, true)
  } else {
    console.log('File validation failed:', file.originalname);
    cb(new Error('Not an image! Please upload an image file.'), false)
  }
};

const uploadConfig = { 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB max size
  }
};

// Middleware for avatar upload
const uploadAvatar = multer(uploadConfig).single('avatar');

// Middleware for featured image upload
const uploadFeaturedImage = multer(uploadConfig).single('featured_image');

// Creating wrapper middleware for error handling
const handleUploadError = (req, res, next, uploadFn, isOptional = false) => {
  uploadFn(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('Multer error:', err);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message,
        code: 'MULTER_ERROR'
      });
    } else if (err) {
      console.log('Upload error:', err);
      return res.status(400).json({
        message: 'File upload failed',
        error: err.message,
        code: 'UPLOAD_ERROR'
      });
    }
    
    if (!req.file && !isOptional) {
      console.log('No file uploaded');
      return res.status(400).json({
        message: 'Please upload a file',
        code: 'NO_FILE'
      });
    }
    
    next();
  });
};

const wrapUploadMiddleware = (uploadFn, isOptional = false) => {
  return (req, res, next) => handleUploadError(req, res, next, uploadFn, isOptional);
};

module.exports = {
  uploadAvatar: wrapUploadMiddleware(uploadAvatar, true),
  uploadFeaturedImage: wrapUploadMiddleware(uploadFeaturedImage)
}; 