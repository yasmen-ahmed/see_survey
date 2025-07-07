const express = require('express');
const router = express.Router();
const PowerMeterService = require('../services/PowerMeterService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

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
  .put(uploadAnyWithErrorHandling, async (req, res) => {
    try {
      console.log('Processing Power Meter PUT request:', {
        sessionId: req.params.session_id,
        files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })) : 'No files',
        body: req.body
      });

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

      // Handle form-data with JSON
      if (req.body.data) {
        try {
          updateData = JSON.parse(req.body.data);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: {
              type: 'INVALID_JSON',
              message: 'Invalid JSON in data field'
            }
          });
        }
      } else {
        // Handle regular JSON body
        updateData = req.body;
      }

      // Get all uploaded files
      const imageFiles = req.files || [];
      
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
        await PowerMeterService.getOrCreateBySessionId(
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
      res.status(statusCode).json({
        success: false,
        error: {
          type: error.type || 'SERVER_ERROR',
          message: error.message,
          details: error.stack
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