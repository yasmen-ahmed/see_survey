const express = require('express');
const router = express.Router();
const multer = require('multer');
const RanRoomService = require('../services/RanRoomService');
const RanRoomImageService = require('../services/RanRoomImageService');
const BtsImageService = require('../services/BtsImageService');

// Configure multer to handle any field names dynamically
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 50 // Allow up to 50 files
  }
});

/**
 * Main endpoint for RAN Room Info
 * GET: Retrieve data with default empty structure
 * PUT: Create or update data
 */
router.route('/:session_id')
  .get(async (req, res) => {
    try {
      const { session_id } = req.params;
      
      // Validate session_id parameter
      if (!session_id || session_id.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_PARAMETER',
            message: 'session_id is required'
          }
        });
      }
      
      // Get or create RAN room data (will include cabinet count from outdoor cabinets)
      const data = await RanRoomService.getOrCreateBySessionId(session_id);
      
      // Get RAN room images
      const ranRoomImages = await RanRoomImageService.getImagesBySessionId(session_id);
      
      // Get BTS images
      const btsImages = await BtsImageService.getImagesBySessionId(session_id);
      
      // Ensure both are arrays before combining
      const ranRoomImagesArray = Array.isArray(ranRoomImages) ? ranRoomImages : [];
      const btsImagesArray = Array.isArray(btsImages) ? btsImages : [];
      
      // Combine all images
      const allImages = [...ranRoomImagesArray, ...btsImagesArray];
      
      res.json({
        success: true,
        data: {
          ...data,
          images: allImages
        }
      });
      
    } catch (error) {
      console.error('RAN Room GET Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .put(upload.any(), async (req, res) => {
    try {
      const { session_id } = req.params;
      const updateData = req.body;
      const files = req.files;
      
      // Validate session_id parameter
      if (!session_id || session_id.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_PARAMETER',
            message: 'session_id is required'
          }
        });
      }
      
      // Parse the form data
      let parsedData = {};
      try {
        if (updateData.data) {
          parsedData = JSON.parse(updateData.data);
        } else {
          parsedData = updateData;
        }
      } catch (parseError) {
        console.error('Error parsing form data:', parseError);
        return res.status(400).json({
          success: false,
          error: {
            type: 'PARSE_ERROR',
            message: 'Invalid JSON data in request body'
          }
        });
      }

      // Convert files array to object format for easier processing
      const filesObject = {};
      if (files && Array.isArray(files)) {
        files.forEach(file => {
          if (!filesObject[file.fieldname]) {
            filesObject[file.fieldname] = [];
          }
          filesObject[file.fieldname].push(file);
        });
      }

      // Separate RAN room images from BTS images
      const ranRoomFiles = {};
      const btsFiles = {};

      if (filesObject && Object.keys(filesObject).length > 0) {
        for (const [fieldName, fileArray] of Object.entries(filesObject)) {
          if (fileArray && fileArray.length > 0) {
            // Check if it's a BTS image (format: bts_1_rack_photo_1)
            if (fieldName.startsWith('bts_')) {
              btsFiles[fieldName] = fileArray;
            } else {
              ranRoomFiles[fieldName] = fileArray;
            }
          }
        }
      }

      // Process RAN room images if any
      if (Object.keys(ranRoomFiles).length > 0) {
        try {
          await RanRoomImageService.processAndSaveImages(session_id, ranRoomFiles);
        } catch (imageError) {
          console.error('Error processing RAN room images:', imageError);
          return res.status(500).json({
            success: false,
            error: {
              type: 'IMAGE_PROCESSING_ERROR',
              message: 'Failed to process uploaded RAN room images'
            }
          });
        }
      }

      // Process BTS images if any
      if (Object.keys(btsFiles).length > 0) {
        try {
          await BtsImageService.processAndSaveImages(session_id, btsFiles);
        } catch (imageError) {
          console.error('Error processing BTS images:', imageError);
          return res.status(500).json({
            success: false,
            error: {
              type: 'IMAGE_PROCESSING_ERROR',
              message: 'Failed to process uploaded BTS images'
            }
          });
        }
      }

      // Update RAN room data
      const updatedData = await RanRoomService.updateBySessionId(session_id, {
        ran_equipment: parsedData
      });

      // Get updated images after processing
      const ranRoomImages = await RanRoomImageService.getImagesBySessionId(session_id);
      const btsImages = await BtsImageService.getImagesBySessionId(session_id);
      
      // Ensure both are arrays before combining
      const ranRoomImagesArray = Array.isArray(ranRoomImages) ? ranRoomImages : [];
      const btsImagesArray = Array.isArray(btsImages) ? btsImages : [];
      
      // Combine all images
      const allImages = [...ranRoomImagesArray, ...btsImagesArray];

      res.json({
        success: true,
        data: {
          ...updatedData,
          images: allImages
        },
        message: 'RAN room data updated successfully'
      });
      
    } catch (error) {
      console.error('RAN Room PUT Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                        error.type === 'NOT_FOUND' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  });

/**
 * Get technology options from Site Information
 */
router.get('/:session_id/technology-options', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Validate session_id parameter
    if (!session_id || session_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }

    // For now, return default technology options
    // This can be enhanced to fetch from Site Information if needed
    const technologyOptions = ['2G', '3G', '4G', '5G', 'Other'];
    
    res.json({
      success: true,
      data: {
        technology_options: technologyOptions
      }
    });
    
  } catch (error) {
    console.error('Technology Options GET Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get cabinet count from outdoor cabinets
 */
router.get('/:session_id/cabinet-count', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Validate session_id parameter
    if (!session_id || session_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }

    // Get current RAN room data to get cabinet count
    const data = await RanRoomService.getOrCreateBySessionId(session_id);
    
    res.json({
      success: true,
      data: {
        numberOfCabinets: data.numberOfCabinets
      }
    });
    
  } catch (error) {
    console.error('Cabinet Count GET Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Refresh cabinet count from outdoor cabinets
 */
router.post('/:session_id/refresh-cabinet-count', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Validate session_id parameter
    if (!session_id || session_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }

    // Refresh cabinet count from outdoor cabinets
    const result = await RanRoomService.refreshCabinetCount(session_id);
    
    res.json({
      success: true,
      data: result,
      message: 'Cabinet count refreshed successfully'
    });
    
  } catch (error) {
    console.error('Refresh Cabinet Count Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Delete RAN room data
 */
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Validate session_id parameter
    if (!session_id || session_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }

    // Delete RAN room images first
    try {
      await RanRoomImageService.deleteImagesBySessionId(session_id);
    } catch (imageError) {
      console.error('Error deleting RAN room images:', imageError);
      // Continue with data deletion even if image deletion fails
    }

    // Delete BTS images
    try {
      await BtsImageService.deleteImagesBySessionId(session_id);
    } catch (imageError) {
      console.error('Error deleting BTS images:', imageError);
      // Continue with data deletion even if image deletion fails
    }

    // Delete RAN room data
    const result = await RanRoomService.deleteBySessionId(session_id);
    
    res.json({
      success: true,
      data: result,
      message: 'RAN room data deleted successfully'
    });
    
  } catch (error) {
    console.error('RAN Room DELETE Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get all RAN room data (for admin purposes)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const data = await RanRoomService.getAll(limit, offset);
    
    res.json({
      success: true,
      data: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('RAN Room GET All Error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve RAN room data'
      }
    });
  }
});

/**
 * Health check endpoint for this module
 */
router.get('/health/check', (req, res) => {
  res.json({
    success: true,
    module: 'ran-room',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'bts_table_management',
      'ran_equipment_vendor_management',
      'free_slots_tracking',
      'rack_type_configuration',
      'installation_location_planning',
      'transmission_cable_measurement',
      'ran_room_image_upload_management',
      'bts_image_upload_management',
      'cabinet_count_integration'
    ]
  });
});

module.exports = router; 