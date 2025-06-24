const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll handle file saving in the service)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
  
  // Check extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, bmp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('image');

// Middleware for multiple files upload (max 10)
const uploadMultiple = upload.array('images', 10);

// Middleware with error handling
const uploadSingleWithErrorHandling = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large. Maximum size is 10MB' 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: 'Unexpected field name. Use "image" as field name' 
        });
      }
      return res.status(400).json({ 
        error: `Upload error: ${err.message}` 
      });
    }
    
    if (err) {
      return res.status(400).json({ 
        error: err.message 
      });
    }
    
    next();
  });
};

const uploadMultipleWithErrorHandling = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'One or more files too large. Maximum size is 10MB per file' 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: 'Too many files. Maximum is 10 files per request' 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: 'Unexpected field name. Use "images" as field name' 
        });
      }
      return res.status(400).json({ 
        error: `Upload error: ${err.message}` 
      });
    }
    
    if (err) {
      return res.status(400).json({ 
        error: err.message 
      });
    }
    
    next();
  });
};

module.exports = {
  uploadSingle: uploadSingleWithErrorHandling,
  uploadMultiple: uploadMultipleWithErrorHandling,
  upload // Raw multer instance if needed
}; 