const express = require('express');
const router = express.Router();
const AntennaStructureService = require('../services/AntennaStructureService');

/**
 * GET /api/antenna-structure/:sessionId
 * Get antenna structure data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await AntennaStructureService.getOrCreateBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Antenna Structure data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting antenna structure data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve antenna structure data'
      }
    });
  }
});

/**
 * PUT /api/antenna-structure/:sessionId
 * Update antenna structure data by session ID
 */
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    // Validate that we have data to update
    if (!updateData ) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No data provided for update'
        }
      });
    }
    
    const result = await AntennaStructureService.getOrCreateBySessionId(sessionId, updateData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Antenna Structure data updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating antenna structure data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update antenna structure data'
      }
    });
  }
});

/**
 * DELETE /api/antenna-structure/:sessionId
 * Delete antenna structure data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await AntennaStructureService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'Antenna Structure data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Antenna Structure data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting antenna structure data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete antenna structure data'
      }
    });
  }
});

/**
 * GET /api/antenna-structure/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await AntennaStructureService.getCabinetOptions(sessionId);
    
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
 * GET /api/antenna-structure/form-options
 * Get all form options for dropdowns and checkboxes
 */
router.get('/form-options', async (req, res) => {
  try {
    // const options = AntennaStructureService.getFormOptions();
    
    res.status(200).json({
      success: true,
      data: options,
      message: 'Form options retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting form options:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve form options'
      }
    });
  }
});

module.exports = router; 