const express = require('express');
const router = express.Router();
const multer = require('multer');
const RoomDCPowerSystemService = require('../services/RoomDCPowerSystemService');
const RoomDCPowerSystemImageService = require('../services/RoomDCPowerSystemImageService');
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to generate dynamic upload fields
const getDynamicUploadFields = (maxRectifiers = 20, maxBatteries = 10) => {
  const fields = [
    { name: 'overall_rectifier_cabinet_photo', maxCount: 1 }
  ];

  // Add rectifier module photo fields
  for (let i = 1; i <= maxRectifiers; i++) {
    fields.push({ name: `rectifier_module_photo_${i}`, maxCount: 1 });
  }

  fields.push(
    { name: 'free_slots_rectifier_modules', maxCount: 1 },
    { name: 'rectifier_cb_photos', maxCount: 1 },
    { name: 'rectifier_free_cb_photo', maxCount: 1 },
    { name: 'rect_load_current_reading_photo', maxCount: 1 },
    { name: 'existing_site_temperature_photo', maxCount: 1 },
    { name: 'rectifier_picture', maxCount: 1 },
    { name: 'rectifier_manufactory_specification_picture', maxCount: 1 }
  );

  // Add battery string photo fields
  for (let i = 1; i <= maxBatteries; i++) {
    fields.push({ name: `battery_string_photo_${i}`, maxCount: 1 });
  }

  fields.push(
    { name: 'battery_model_photo', maxCount: 1 },
    { name: 'battery_cb_photo', maxCount: 1 },
    { name: 'rectifier_main_ac_cb_photo', maxCount: 1 },
    { name: 'pdu_photos', maxCount: 1 },
    { name: 'pdu_free_cb', maxCount: 1 },
    { name: 'blvd_in_dc_power_rack', maxCount: 1 },
    { name: 'llvd_in_dc_power_rack', maxCount: 1 },
    { name: 'pdu_in_dc_power_rack', maxCount: 1 }
  );

  return fields;
};

/**
 * GET /api/room-dc-power-system/:sessionId
 * Get Room DC power system data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await RoomDCPowerSystemService.getOrCreateBySessionId(sessionId);
    const images = await RoomDCPowerSystemImageService.getImagesBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: {
        ...result,
        images
      },
      message: 'Room DC Power System data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting Room DC power system data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve Room DC power system data'
      }
    });
  }
});

/**
 * PUT /api/room-dc-power-system/:sessionId
 * Update Room DC power system data by session ID
 */
router.put('/:sessionId', upload.fields(getDynamicUploadFields()), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    const files = req.files;
    
    // Validate that we have data to update
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No data provided for update'
        }
      });
    }
    
    // Parse the form data
    let parsedData = {};
    try {
      if (updateData.dc_rectifiers) {
        const dc_rectifiers = JSON.parse(updateData.dc_rectifiers);
        // Ensure numeric values are properly parsed
        parsedData.dc_rectifiers = {
          ...dc_rectifiers,
          how_many_existing_dc_rectifier_modules: parseInt(dc_rectifiers.how_many_existing_dc_rectifier_modules) || 0,
          rectifier_module_capacity: parseFloat(dc_rectifiers.rectifier_module_capacity) || 0,
          total_capacity_existing_dc_power_system: parseFloat(dc_rectifiers.total_capacity_existing_dc_power_system) || 0,
          how_many_free_slot_available_rectifier: parseInt(dc_rectifiers.how_many_free_slot_available_rectifier) || 0,
          rect_load_current_reading: parseFloat(dc_rectifiers.rect_load_current_reading) || 0,
          existing_site_temperature: parseFloat(dc_rectifiers.existing_site_temperature) || 0
        };
      }
      
      if (updateData.batteries) {
        const batteries = JSON.parse(updateData.batteries);
        // Ensure numeric values are properly parsed
        parsedData.batteries = {
          ...batteries,
          how_many_existing_battery_string: parseInt(batteries.how_many_existing_battery_string) || 0,
          total_battery_capacity: parseFloat(batteries.total_battery_capacity) || 0,
          how_many_free_slot_available_battery: parseInt(batteries.how_many_free_slot_available_battery) || 0,
          new_battery_string_installation_location: Array.isArray(batteries.new_battery_string_installation_location) 
            ? batteries.new_battery_string_installation_location 
            : [],
          new_battery_capacity: parseFloat(batteries.new_battery_capacity) || 0,
          new_battery_qty: parseInt(batteries.new_battery_qty) || 0
        };
      }

      if (updateData.cb_fuse_data_blvd) {
        parsedData.cb_fuse_data_blvd = JSON.parse(updateData.cb_fuse_data_blvd);
      }
      if (updateData.cb_fuse_data_llvd) {
        parsedData.cb_fuse_data_llvd = JSON.parse(updateData.cb_fuse_data_llvd);
      }
      if (updateData.cb_fuse_data_pdu) {
        parsedData.cb_fuse_data_pdu = JSON.parse(updateData.cb_fuse_data_pdu);
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
    
    // Update the Room DC power system data first
    const result = await RoomDCPowerSystemService.getOrCreateBySessionId(sessionId, parsedData);
    
    // Handle image uploads if any
    const uploadedImages = [];
    if (files) {
      for (const [category, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          try {
            const uploadedImage = await RoomDCPowerSystemImageService.replaceImage({
              file: fileArray[0],
              session_id: sessionId,
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
    const images = await RoomDCPowerSystemImageService.getImagesBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: {
        ...result,
        images
      },
      message: 'Room DC Power System data updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating Room DC power system data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update Room DC power system data'
      }
    });
  }
});

/**
 * DELETE /api/room-dc-power-system/:sessionId
 * Delete Room DC power system data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await RoomDCPowerSystemService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'Room DC Power System data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Room DC Power System data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting Room DC power system data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete Room DC power system data'
      }
    });
  }
});

/**
 * GET /api/room-dc-power-system/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await RoomDCPowerSystemService.getCabinetOptions(sessionId);
    
    res.status(200).json({
      success: true,
      data: {
        session_id: sessionId,
        cabinet_options: options
      },
      message: 'Cabinet options retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting cabinet options:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve cabinet options'
      }
    });
  }
});

/**
 * GET /api/room-dc-power-system/:sessionId/images
 * Get all images for a session
 */
router.get('/:sessionId/images', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const images = await RoomDCPowerSystemImageService.getImagesBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: {
        session_id: sessionId,
        images
      },
      message: 'Room DC Power System images retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting Room DC power system images:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve images'
      }
    });
  }
});

/**
 * DELETE /api/room-dc-power-system/:sessionId/images/:imageId
 * Delete a specific image
 */
router.delete('/:sessionId/images/:imageId', async (req, res) => {
  try {
    const { sessionId, imageId } = req.params;
    
    const result = await RoomDCPowerSystemImageService.deleteImage(imageId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting Room DC power system image:', error);
    
    const statusCode = error.type === 'NOT_FOUND' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete image'
      }
    });
  }
});

module.exports = router; 