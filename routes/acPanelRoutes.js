const express = require('express');
const router = express.Router();
const AcPanelService = require('../services/AcPanelService');

/**
 * Main endpoint for AC Panel Info
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
      
      const data = await AcPanelService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      console.error('AC Panel GET Error:', error);
      
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
      
      const data = await AcPanelService.getOrCreateBySessionId(session_id, updateData);
      
      res.json({
        success: true,
        data,
        message: 'AC panel info updated successfully'
      });
      
    } catch (error) {
      console.error('AC Panel PUT Error:', error);
      
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
 * Dynamic CB/Fuse table management endpoints
 */

// Add new CB/Fuse entry
router.post('/:session_id/cb-entry', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    if (!session_id || session_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }
    
    const data = await AcPanelService.addNewCBEntry(session_id);
    
    res.json({
      success: true,
      data,
      message: 'New CB/Fuse entry added successfully'
    });
    
  } catch (error) {
    console.error('Add CB Entry Error:', error);
    
    let statusCode = 500;
    if (error.type === 'VALIDATION_ERROR') statusCode = 400;
    if (error.type === 'FOREIGN_KEY_ERROR') statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

// Remove CB/Fuse entry by ID
router.delete('/:session_id/cb-entry/:entry_id', async (req, res) => {
  try {
    const { session_id, entry_id } = req.params;
    
    if (!session_id || session_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }
    
    if (!entry_id || isNaN(entry_id)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'entry_id must be a valid number'
        }
      });
    }
    
    const data = await AcPanelService.removeCBEntry(session_id, parseInt(entry_id));
    
    res.json({
      success: true,
      data,
      message: 'CB/Fuse entry removed successfully'
    });
    
  } catch (error) {
    console.error('Remove CB Entry Error:', error);
    
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
 * Get connected module names for a session
 * GET: Returns only the connected_module names from cb_fuse_data
 */
router.get('/:session_id/connected-modules', async (req, res) => {
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
    
    const data = await AcPanelService.getOrCreateBySessionId(session_id);
    
    // Extract connected module names
    const connectedModules = data.cb_fuse_data
      .map(item => item.connected_module)
      .filter(module => module && module.trim() !== ''); // Remove empty values
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        connected_modules: connectedModules,
        total_modules: connectedModules.length
      }
    });
    
  } catch (error) {
    console.error('Get Connected Modules Error:', error);
    
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
    module: 'ac-panel',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'dynamic_table_management',
      'cb_fuse_configuration',
      'auto_column_generation'
    ]
  });
});

module.exports = router; 