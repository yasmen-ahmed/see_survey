const express = require('express');
const router = express.Router();
const AcPanelService = require('../services/AcPanelService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

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
  .put(uploadAnyWithErrorHandling, async (req, res) => {
    try {
      console.log('Processing AC Panel PUT request:', {
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
        // Handle individual form fields
        try {
          if (req.body.power_cable_config) {
            updateData.power_cable_config = JSON.parse(req.body.power_cable_config);
          }
          
          if (req.body.main_cb_config) {
            updateData.main_cb_config = JSON.parse(req.body.main_cb_config);
          }
          
          if (req.body.cb_fuse_data) {
            updateData.cb_fuse_data = JSON.parse(req.body.cb_fuse_data);
          }
          
          if (req.body.has_free_cbs) {
            updateData.has_free_cbs = req.body.has_free_cbs === 'true';
          }
          
          if (req.body.free_cb_spaces) {
            updateData.free_cb_spaces = parseInt(req.body.free_cb_spaces);
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: {
              type: 'INVALID_JSON',
              message: 'Invalid JSON in form fields'
            }
          });
        }
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
        await AcPanelService.getOrCreateBySessionId(
          session_id,
          updateData,
          file
        );
        updateData = {}; // Clear update data after first save to prevent duplicate updates
      }

      // If there were no images but we have data, process the update
      if (imageFiles.length === 0 && Object.keys(updateData).length > 0) {
        await AcPanelService.getOrCreateBySessionId(
          session_id,
          updateData,
          null
        );
      }

      // Get final state after all updates
      const finalData = await AcPanelService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data: finalData,
        message: 'AC panel info updated successfully'
      });
      
    } catch (error) {
      console.error('AC Panel PUT Error:', error);
      
      res.status(500).json({
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