const express = require('express');
const router = express.Router();
const PowerMeterService = require('../services/PowerMeterService');
const { upload } = require('../middleware/upload');

// Configure upload middleware for power meter images
const powerMeterUpload = upload.fields([
  { name: 'power_meter_photo_overview', maxCount: 1 },
  { name: 'power_meter_photo_zoomed', maxCount: 1 },
  { name: 'power_meter_cb_photo', maxCount: 1 },
  { name: 'power_meter_cable_route_photo', maxCount: 1 }
]);

/**
 * Single endpoint for Power Meter Info
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
      
      const data = await PowerMeterService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      console.error('Power Meter GET Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .put(powerMeterUpload, async (req, res) => {
    try {
      const { session_id } = req.params;
      let updateData = {};
      
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

      // Process form data if present
      if (req.body) {
        try {
          // Parse the data JSON string
          if (req.body.data) {
            updateData = JSON.parse(req.body.data);
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: {
              type: 'INVALID_REQUEST',
              message: 'Invalid JSON in form data'
            }
          });
        }
      }

      // Get all uploaded files
      const imageFiles = req.files ? Object.values(req.files).map(f => f[0]) : [];
      
      // Validate that either file or body data is present
      if (imageFiles.length === 0 && Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_REQUEST',
            message: 'Request must include either form data or an image file'
          }
        });
      }

      // Process each image file
      for (const file of imageFiles) {
        const data = await PowerMeterService.getOrCreateBySessionId(
          session_id,
          updateData,
          file
        );
        updateData = {}; // Clear update data after first save to prevent duplicate updates
      }

      // If there were no images but we have data, process the update
      if (imageFiles.length === 0 && Object.keys(updateData).length > 0) {
        await PowerMeterService.getOrCreateBySessionId(
          session_id,
          updateData,
          null
        );
      }

      // Get final state after all updates
      const finalData = await PowerMeterService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data: finalData,
        message: 'Power meter info updated successfully'
      });
      
    } catch (error) {
      console.error('Power Meter PUT Error:', error);
      
      let statusCode = 500;
      let errorType = 'SERVER_ERROR';
      let errorMessage = error.message || 'An unexpected error occurred';

      if (error.type === 'VALIDATION_ERROR') {
        statusCode = 400;
        errorType = 'VALIDATION_ERROR';
        errorMessage = error.message;
      } else if (error.type === 'FOREIGN_KEY_ERROR') {
        statusCode = 400;
        errorType = 'FOREIGN_KEY_ERROR';
        errorMessage = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
          details: error.errors || undefined
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
    module: 'power-meter',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 