const express = require('express');
const router = express.Router();
const AcConnectionService = require('../services/AcConnectionService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

/**
 * Single endpoint for AC Connection Info
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
      
      const data = await AcConnectionService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      console.error('AC Connection GET Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .put(uploadAnyWithErrorHandling, async (req, res) => {
    try {
      console.log('Processing AC Connection PUT request:', {
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
      
      // Get the image file if it exists
      const imageFile = req.files?.find(f => f.fieldname === 'generator_photo');
      
      // Validate that either file or body data is present
      if (!imageFile && (!updateData || Object.keys(updateData).length === 0)) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_REQUEST',
            message: 'Request must include either form data or an image file'
          }
        });
      }
      
      const data = await AcConnectionService.getOrCreateBySessionId(
        session_id,
        Object.keys(updateData).length > 0 ? updateData : null,
        imageFile
      );
      
      res.json({
        success: true,
        data,
        message: 'AC connection info updated successfully'
      });
      
    } catch (error) {
      console.error('AC Connection PUT Error:', error);
      
      let statusCode = 500;
      if (error.type === 'VALIDATION_ERROR') statusCode = 400;
      if (error.type === 'FOREIGN_KEY_ERROR') statusCode = 400;
      
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
    module: 'ac-connection-info',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 