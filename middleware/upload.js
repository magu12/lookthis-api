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
    fileSize: 5 * 1024 * 1024 // 5MB max size
  }
};

// Middleware for avatar upload
const uploadAvatar = multer(uploadConfig).single('avatar');

// Middleware for featured image upload
const uploadFeaturedImage = multer(uploadConfig).single('featured_image');

// Creating wrapper middleware for error handling
const handleUploadError = (req, res, next, uploadFn) => {
  uploadFn(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('Multer error:', err);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      console.log('Unknown error:', err);
      return res.status(400).json({
        message: err.message
      });
    }
    next();
  });
};

const avatarUploadMiddleware = (req, res, next) => {
  handleUploadError(req, res, next, uploadAvatar);
};

const featuredImageUploadMiddleware = (req, res, next) => {
  handleUploadError(req, res, next, uploadFeaturedImage);
};

module.exports = {
  avatarUploadMiddleware,
  featuredImageUploadMiddleware
}; 