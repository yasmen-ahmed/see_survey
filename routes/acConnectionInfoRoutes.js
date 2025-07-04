const express = require('express');
const router = express.Router();
const AcConnectionService = require('../services/AcConnectionService');
const { upload } = require('../middleware/upload'); // Import the raw multer instance

// Configure upload middleware for AC connection images
const acConnectionUpload = upload.single('generator_photo');

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
  .put(acConnectionUpload, async (req, res) => {
    try {
      const { session_id } = req.params;
      const updateData = req.body || {};
      const imageFile = req.file;
      
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
    module: 'ac-connection-info',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 