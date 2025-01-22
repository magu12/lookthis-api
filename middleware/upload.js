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

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max size
  }
}).single('avatar');

// Creating wrapper middleware for error handling
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
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

module.exports = uploadMiddleware; 