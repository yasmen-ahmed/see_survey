const express = require('express');
const router = express.Router();
const OutdoorCabinetsService = require('../services/OutdoorCabinetsService');
const OutdoorCabinetsImageService = require('../services/OutdoorCabinetsImageService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

/**
 * Main endpoint for Outdoor Cabinets Info
 * GET: Retrieve data (returns defaults if no data exists)
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
      
      const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      console.error('Outdoor Cabinets GET Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .put(uploadAnyWithErrorHandling, async (req, res) => {
    try {
      const { session_id } = req.params;
      let updateData = {};
      let imageResults = [];
      let hasImageUploadFailures = false;
      
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
      
      // Parse the data from the request
      if (req.body.data) {
        try {
          // Try to parse the JSON data
          updateData = JSON.parse(req.body.data);
          console.log('Parsed JSON data:', updateData);
        } catch (e) {
          console.error('Error parsing JSON data:', e);
          return res.status(400).json({
            success: false,
            error: {
              type: 'INVALID_DATA',
              message: 'Invalid JSON data format'
            }
          });
        }
      } else if (req.body.numberOfCabinets || req.body.cabinets) {
        // Handle form data with individual fields
        updateData = {
          numberOfCabinets: parseInt(req.body.numberOfCabinets),
          cabinets: []
        };

        // Get the number of cabinets
        const numCabinets = parseInt(req.body.numberOfCabinets) || 1;

        // Process each cabinet's data
        for (let i = 0; i < numCabinets; i++) {
          const cabinet = {
            id: i + 1,
            type: [],
            hardware: [],
            blvdCBsRatings: [],
            llvdCBsRatings: [],
            pduCBsRatings: []
          };

          // Get all fields for this cabinet
          Object.keys(req.body).forEach(key => {
            const match = key.match(/^cabinets\[(\d+)\]\[(.+)\]$/);
            if (match && parseInt(match[1]) === i) {
              const field = match[2];
              let value = req.body[key];

              // Parse JSON strings for array fields
              if (['type', 'hardware', 'blvdCBsRatings', 'llvdCBsRatings', 'pduCBsRatings'].includes(field)) {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  console.warn(`Failed to parse JSON for ${field}:`, e);
                  value = [];
                }
              }

              cabinet[field] = value;
            }
          });

          updateData.cabinets.push(cabinet);
        }
      } else if (Object.keys(req.body).length > 0) {
        // Regular JSON body
        updateData = req.body;
      }

      console.log('Final update data:', updateData);

      // Process cabinet data if present
      if (updateData && Object.keys(updateData).length > 0) {
        console.log('Processing cabinet data:', updateData);
        
        // Update cabinet data
        const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id, updateData);
        
        // Process image uploads if present
        if (req.files && req.files.length > 0) {
          console.log('Processing image uploads:', req.files.length);
          
          for (const file of req.files) {
            try {
              let imageCategory = file.fieldname;
              let cabinetNumber = null;

              // Extract cabinet number from image category
              const match = imageCategory.match(/cabinet_(\d+)_/);
              if (match) {
                cabinetNumber = parseInt(match[1]);
              }

              if (!cabinetNumber) {
                imageResults.push({
                  category: imageCategory,
                  success: false,
                  error: 'Could not determine cabinet number from image category'
                });
                hasImageUploadFailures = true;
                continue;
              }

              const result = await OutdoorCabinetsImageService.replaceImage({
                file,
                session_id,
                cabinet_number: cabinetNumber,
                image_category: imageCategory,
                description: null
              });

              imageResults.push({
                category: imageCategory,
                cabinet_number: cabinetNumber,
                success: true,
                data: result.data
              });
            } catch (err) {
              hasImageUploadFailures = true;
              imageResults.push({
                category: file.fieldname,
                success: false,
                error: err.message
              });
            }
          }
        }

        // Get updated data with images
        const finalData = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);

        const successCount = imageResults.filter(r => r.success).length;
        const failCount = imageResults.filter(r => !r.success).length;

        res.json({
          success: !hasImageUploadFailures,
          data: finalData,
          message: hasImageUploadFailures
            ? `Data updated successfully, but ${failCount} image upload(s) failed`
            : `Data and ${successCount} image(s) updated successfully`,
          images_processed: {
            total: imageResults.length,
            successful: successCount,
            failed: failCount,
            details: imageResults
          }
        });

      } else if (req.files && req.files.length > 0) {
        // Only images, no data update
        console.log('Processing only image uploads:', req.files.length);
        
        for (const file of req.files) {
          try {
            let imageCategory = file.fieldname;
            let cabinetNumber = null;

            // Extract cabinet number from image category
            const match = imageCategory.match(/cabinet_(\d+)_/);
            if (match) {
              cabinetNumber = parseInt(match[1]);
            }

            if (!cabinetNumber) {
              imageResults.push({
                category: imageCategory,
                success: false,
                error: 'Could not determine cabinet number from image category'
              });
              hasImageUploadFailures = true;
              continue;
            }

            const result = await OutdoorCabinetsImageService.replaceImage({
              file,
              session_id,
              cabinet_number: cabinetNumber,
              image_category: imageCategory,
              description: null
            });

            imageResults.push({
              category: imageCategory,
              cabinet_number: cabinetNumber,
              success: true,
              data: result.data
            });
          } catch (err) {
            hasImageUploadFailures = true;
            imageResults.push({
              category: file.fieldname,
              success: false,
              error: err.message
            });
          }
        }

        // Get updated data with images
        const finalData = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);

        const successCount = imageResults.filter(r => r.success).length;
        const failCount = imageResults.filter(r => !r.success).length;

        res.json({
          success: !hasImageUploadFailures,
          data: finalData,
          message: `${successCount} image(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
          images_processed: {
            total: imageResults.length,
            successful: successCount,
            failed: failCount,
            details: imageResults
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_REQUEST',
            message: 'No data or files provided'
          }
        });
      }
    } catch (error) {
      console.error('Outdoor Cabinets PUT Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
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
      
      const result = await OutdoorCabinetsService.deleteBySessionId(session_id);
      
      if (result.deleted) {
        res.json({
          success: true,
          message: 'Outdoor cabinets data deleted successfully',
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: 'No outdoor cabinets data found for this session'
          }
        });
      }
      
    } catch (error) {
      console.error('Outdoor Cabinets DELETE Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  });

/**
 * Get cabinet summary for a session
 * Returns a condensed overview of cabinet configuration
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
    
    const summary = await OutdoorCabinetsService.getCabinetSummary(session_id);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Outdoor Cabinets Summary Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get cabinets with specific equipment
 * Query parameters: equipment (blvd, llvd, pdu, ac_power)
 */
router.get('/:session_id/by-equipment', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { equipment } = req.query;
    
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
    
    // Validate equipment parameter
    const validEquipment = ['blvd', 'llvd', 'pdu', 'ac_power'];
    if (!equipment || !validEquipment.includes(equipment)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: `equipment parameter must be one of: ${validEquipment.join(', ')}`
        }
      });
    }
    
    const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);
    const activeCabinets = data.cabinets.slice(0, data.numberOfCabinets || 0);
    
    let filteredCabinets = [];
    
    switch (equipment) {
      case 'blvd':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.blvd === 'Yes');
        break;
      case 'llvd':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.llvd === 'Yes');
        break;
      case 'pdu':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.pdu === 'Yes');
        break;
      case 'ac_power':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.acPowerFeed === 'Yes');
        break;
    }
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        equipment_type: equipment,
        total_cabinets_with_equipment: filteredCabinets.length,
        cabinets: filteredCabinets
      }
    });
    
  } catch (error) {
    console.error('Outdoor Cabinets By Equipment Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get all cabinet vendors used in a session
 */
router.get('/:session_id/vendors', async (req, res) => {
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
    
    const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);
    const activeCabinets = data.cabinets.slice(0, data.numberOfCabinets || 0);
    
    const vendors = [...new Set(
      activeCabinets
        .map(cabinet => cabinet.vendor)
        .filter(vendor => vendor && vendor.trim() !== '')
    )];
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        vendors: vendors,
        total_unique_vendors: vendors.length
      }
    });
    
  } catch (error) {
    console.error('Outdoor Cabinets Vendors Error:', error);
    
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
    module: 'outdoor-cabinets',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'cabinet_configuration_management',
      'equipment_tracking',
      'power_distribution_management',
      'space_utilization_tracking',
      'vendor_analytics'
    ]
  });
});

// Upload/replace cabinet image
router.post('/:sessionId/cabinet/:cabinetNumber/image', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new Error('No image file provided');
    }

    const file = req.files[0]; // Get the first file
    const image_category = req.body.image_category;
    
    if (!image_category) {
      throw new Error('Image category is required');
    }

    const result = await OutdoorCabinetsImageService.replaceImage({
      file,
      session_id: req.params.sessionId,
      cabinet_number: parseInt(req.params.cabinetNumber),
      image_category,
      description: req.body.description || null
    });

    res.json(result);
  } catch (error) {
    console.error('Error uploading cabinet image:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Delete cabinet images
router.delete('/:sessionId/cabinet/:cabinetNumber/images', async (req, res) => {
  try {
    const result = await OutdoorCabinetsImageService.deleteImagesBySessionAndNumber(
      req.params.sessionId,
      parseInt(req.params.cabinetNumber)
    );

    res.json({
      success: true,
      message: 'Images deleted successfully',
      count: result
    });
  } catch (error) {
    console.error('Error deleting cabinet images:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Delete all images for a session
router.delete('/:sessionId/images', async (req, res) => {
  try {
    const result = await OutdoorCabinetsImageService.deleteAllImagesBySessionId(req.params.sessionId);

    res.json({
      success: true,
      message: 'All session images deleted successfully',
      count: result
    });
  } catch (error) {
    console.error('Error deleting session images:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Delete outdoor cabinets data and images
router.delete('/:sessionId', async (req, res) => {
  try {
    const result = await OutdoorCabinetsService.deleteBySessionId(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting outdoor cabinets:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router; 