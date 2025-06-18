const express = require('express');
const router = express.Router();
const MWAntennasService = require('../services/MWAntennasService');

/**
 * GET /api/mw-antennas/:sessionId
 * Get MW antennas data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await MWAntennasService.getOrCreateBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'MW Antennas data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting MW antennas data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve MW antennas data'
      }
    });
  }
});

/**
 * PUT /api/mw-antennas/:sessionId
 * Update MW antennas data by session ID
 */
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    // Validate that we have data to update
    if (!updateData) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No data provided for update'
        }
      });
    }
    
    const result = await MWAntennasService.getOrCreateBySessionId(sessionId, updateData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'MW Antennas data updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating MW antennas data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update MW antennas data'
      }
    });
  }
});

/**
 * DELETE /api/mw-antennas/:sessionId
 * Delete MW antennas data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await MWAntennasService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'MW Antennas data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'MW Antennas data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting MW antennas data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete MW antennas data'
      }
    });
  }
});

/**
 * GET /api/mw-antennas/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await MWAntennasService.getCabinetOptions(sessionId);
    
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