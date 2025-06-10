const express = require('express');
const router = express.Router();
const PowerMeterService = require('../services/PowerMeterService');

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
  .put(async (req, res) => {
    try {
      const { session_id } = req.params;
      const updateData = req.body;
      
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
      
      const data = await PowerMeterService.getOrCreateBySessionId(session_id, updateData);
      
      res.json({
        success: true,
        data,
        message: 'Power meter info updated successfully'
      });
      
    } catch (error) {
      console.error('Power Meter PUT Error:', error);
      
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
    module: 'power-meter',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 