const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to determine upload directory and filename prefix based on field name
const getUploadConfig = (fieldname) => {
  // Remove any spaces and normalize the field name
  const normalizedField = fieldname.replace(/\s+/g, '');
  
  if (normalizedField.startsWith('new_fpfh_')) {
    return {
      directory: 'new_fpfhs',
      prefix: 'new_fpfh_'
    };
  } else if (normalizedField.startsWith('new_radio_unit_')) {
    return {
      directory: 'new_radio_units',
      prefix: 'new_radio_unit_'
    };
  } else if (normalizedField.startsWith('new_antenna_')) {
    return {
      directory: 'new_antennas',
      prefix: 'new_antenna_'
    };
  }
  
  // Default case
  return {
    directory: 'general',
    prefix: 'image_'
  };
};

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { directory } = getUploadConfig(file.fieldname);
    const uploadDir = path.join(__dirname, '../uploads', directory);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const { prefix } = getUploadConfig(file.fieldname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

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
    files: 15 // Max 15 files per request (to cover all categories)
  },
  fileFilter: fileFilter
});

// All available image categories as field names
const imageCategories = [
  'structure_general_photo',
  'structure_legs_photo_1',
  'structure_legs_photo_2', 
  'structure_legs_photo_3',
  'structure_legs_photo_4',
  'building_photo',
  'north_direction_view',
  'cables_route_photo_from_tower_top_1',
  'cables_route_photo_from_tower_top_2',
  'general_structure_photo',
  'custom_photo',
  // AC Connection categories
  'generator_photo',
  'ac_panel_photo',
  'power_meter_photo'
];

// Middleware for single file upload
const uploadSingle = upload.single('image');

// Middleware for multiple files upload using category names as field names
const uploadMultiple = upload.fields(
  imageCategories.map(category => ({ name: category, maxCount: 1 }))
);

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
          error: 'Too many files. Maximum is 1 file per category' 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: `Unexpected field name. Use category names like: ${imageCategories.join(', ')}` 
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
    
    // Process files by category - each category can have max 1 file
    if (req.files) {
      req.imagesByCategory = {};
      
      Object.keys(req.files).forEach(category => {
        if (imageCategories.includes(category) && req.files[category].length > 0) {
          // Take only the first file if multiple were somehow uploaded
          req.imagesByCategory[category] = req.files[category][0];
        }
      });
      
      // Convert to flat array for backward compatibility
      req.files = Object.values(req.imagesByCategory);
    }
    
    next();
  });
};

// Accept any file field (for dynamic antenna fields)
const uploadAny = upload.any();

const uploadAnyWithErrorHandling = (req, res, next) => {
  uploadAny(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

module.exports = {
  uploadSingle: uploadSingleWithErrorHandling,
  uploadMultiple: uploadMultipleWithErrorHandling,
  upload, // Raw multer instance if needed
  imageCategories, // Export categories for use in routes
  uploadAnyWithErrorHandling,
}; 