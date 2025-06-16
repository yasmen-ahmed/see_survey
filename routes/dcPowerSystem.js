const express = require('express');
const router = express.Router();
const DCPowerSystemService = require('../services/DCPowerSystemService');

/**
 * GET /api/dc-power-system/:sessionId
 * Get DC power system data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await DCPowerSystemService.getOrCreateBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'DC Power System data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting DC power system data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve DC power system data'
      }
    });
  }
});

/**
 * PUT /api/dc-power-system/:sessionId
 * Update DC power system data by session ID
 */
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
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
    
    const result = await DCPowerSystemService.getOrCreateBySessionId(sessionId, updateData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'DC Power System data updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating DC power system data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update DC power system data'
      }
    });
  }
});

/**
 * DELETE /api/dc-power-system/:sessionId
 * Delete DC power system data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await DCPowerSystemService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'DC Power System data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'DC Power System data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting DC power system data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete DC power system data'
      }
    });
  }
});

/**
 * GET /api/dc-power-system/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await DCPowerSystemService.getCabinetOptions(sessionId);
    
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

module.exports = router; 