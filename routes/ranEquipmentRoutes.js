const express = require('express');
const router = express.Router();
const multer = require('multer');
const RanEquipmentService = require('../services/RanEquipmentService');
const RanEquipmentImageService = require('../services/RANEquipmentImageService');
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to generate dynamic upload fields
const getDynamicUploadFields = (maxBTS = 10) => {
  const fields = [];
  
  // Add dynamic BTS photo fields based on count
  for (let i = 1; i <= maxBTS; i++) {
    fields.push(
      { name: `bts_${i}_photos_front`, maxCount: 1 },
      { name: `bts_${i}_photos_back`, maxCount: 1 },
      { name: `bts_${i}_photos_left_side`, maxCount: 1 },
      { name: `bts_${i}_photos_right_side`, maxCount: 1 }
    );
  }

  return fields;
};

/**
 * Main endpoint for RAN Equipment Info
 * GET: Retrieve data (returns defaults synced with outdoor cabinets)
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
      
      const data = await RanEquipmentService.getOrCreateBySessionId(session_id);
      const images = await RanEquipmentImageService.getImagesBySessionId(session_id);
      
      res.json({
        success: true,
        data: {
          ...data,
          images
        }
      });
      
    } catch (error) {
      console.error('RAN Equipment GET Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .put(upload.fields(getDynamicUploadFields()), async (req, res) => {
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
      
      // Validate request body
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_BODY',
            message: 'Request body cannot be empty'
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
            type: 'VALIDATION_ERROR',
            message: 'Invalid data format'
          }
        });
      }

      console.log('Parsed data to update:', parsedData);
      
      // Update the RAN equipment data first
      const result = await RanEquipmentService.getOrCreateBySessionId(session_id, parsedData);
      
      // Handle image uploads if any
      const uploadedImages = [];
      if (files) {
        for (const [category, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            try {
              const uploadedImage = await RanEquipmentImageService.replaceImage({
                file: fileArray[0],
                session_id: session_id,
                image_category: category
              });
              uploadedImages.push(uploadedImage);
            } catch (imageError) {
              console.error(`Error uploading image for category ${category}:`, imageError);
            }
          }
        }
      }
      
      // Get all images after updates
      const images = await RanEquipmentImageService.getImagesBySessionId(session_id);
      
      res.json({
        success: true,
        data: {
          ...result,
          images
        },
        message: 'RAN equipment info updated successfully'
      });
      
    } catch (error) {
      console.error('RAN Equipment PUT Error:', error);
      
      let statusCode = 500;
      if (error.type === 'VALIDATION_ERROR') statusCode = 400;
      if (error.type === 'FOREIGN_KEY_ERROR') statusCode = 400;
      if (error.type === 'DUPLICATE_ERROR') statusCode = 409;
      
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .delete(async (req, res) => {
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
      
      const result = await RanEquipmentService.deleteBySessionId(session_id);
      
      if (result.deleted) {
        res.json({
          success: true,
          message: 'RAN equipment data deleted successfully',
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: 'No RAN equipment data found for this session'
          }
        });
      }
      
    } catch (error) {
      console.error('RAN Equipment DELETE Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  });

/**
 * Get equipment summary for a session
 * Returns a condensed overview of RAN equipment configuration
 */
router.get('/:session_id/summary', async (req, res) => {
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
    
    const summary = await RanEquipmentService.getEquipmentSummary(session_id);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('RAN Equipment Summary Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get cabinet options for dropdowns
 * Returns available cabinet options based on outdoor cabinets configuration
 */
router.get('/:session_id/cabinet-options', async (req, res) => {
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
    
    const options = await RanEquipmentService.getCabinetOptions(session_id);
    
    res.json({
      success: true,
      data: {
        session_id: session_id,
        cabinet_options: options,
        total_options: options.length
      }
    });
    
  } catch (error) {
    console.error('RAN Equipment Cabinet Options Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get vendor and model options for dropdowns
 */
router.get('/options/vendors-models', (req, res) => {
  try {
    const options = {
      vendors: ['Nokia', 'Ericsson', 'Huawei', 'ZTE', 'Other'],
      models: {
        Nokia: ['Nokia Air Scale', 'Nokia Felix'],
        Ericsson: ['Ericsson Baseband 6630', 'Ericsson Radio 4449'],
        Huawei: ['Huawei BBU5900', 'Huawei DBS3900'],
        ZTE: ['ZTE BBU', 'ZTE RRU'],
        Other: ['Other']
      },
      installation_options: [
        'Existing cabinet #1', 
        'New Nokia cabinet', 
        'Other'
      ]
    };
    
    res.json({
      success: true,
      data: options
    });
    
  } catch (error) {
    console.error('RAN Equipment Options Error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve vendor and model options'
      }
    });
  }
});

/**
 * Get equipment by vendor filter
 */
router.get('/:session_id/by-vendor', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { vendor } = req.query;
    
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
    
    // Validate vendor parameter
    const validVendors = ['Nokia', 'Ericsson', 'Huawei', 'ZTE', 'Other'];
    if (!vendor || !validVendors.includes(vendor)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: `vendor parameter must be one of: ${validVendors.join(', ')}`
        }
      });
    }
    
    const data = await RanEquipmentService.getOrCreateBySessionId(session_id);
    const filteredEquipment = data.ranEquipment.filter(eq => eq.existing_vendor === vendor);
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        vendor_filter: vendor,
        total_equipment_by_vendor: filteredEquipment.length,
        equipment: filteredEquipment
      }
    });
    
  } catch (error) {
    console.error('RAN Equipment By Vendor Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get technology options from Site Information
 * Returns technology options based on what was selected in Site Information form
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
    
    const technologyOptions = await RanEquipmentService.getTechnologyOptions(session_id);
    
    res.json({
      success: true,
      data: {
        session_id: session_id,
        technology_options: technologyOptions,
        total_options: technologyOptions.length,
        source: 'site_information'
      }
    });
    
  } catch (error) {
    console.error('RAN Equipment Technology Options Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Health check endpoint for this module
 */
router.get('/health/check', (req, res) => {
  res.json({
    success: true,
    module: 'ran-equipment',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'dynamic_equipment_management',
      'outdoor_cabinets_sync',
      'vendor_tracking',
      'model_configuration',
      'installation_planning'
    ]
  });
});

module.exports = router; 