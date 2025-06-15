const express = require('express');
const router = express.Router();
const RanEquipmentService = require('../services/RanEquipmentService');

/**
 * Main endpoint for RAN Equipment Info
 * GET: Retrieve data (returns defaults synced with outdoor cabinets)
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
      
      const data = await RanEquipmentService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      console.error('RAN Equipment GET Error:', error);
      
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
      
      const data = await RanEquipmentService.getOrCreateBySessionId(session_id, updateData);
      
      res.json({
        success: true,
        data,
        message: 'RAN equipment info updated successfully'
      });
      
    } catch (error) {
      console.error('RAN Equipment PUT Error:', error);
      
      let statusCode = 500;
      if (error.type === 'VALIDATION_ERROR') statusCode = 400;
      if (error.type === 'FOREIGN_KEY_ERROR') statusCode = 400;
      if (error.type === 'DUPLICATE_ERROR') statusCode = 409;
      
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .delete(async (req, res) => {
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
      
      const result = await RanEquipmentService.deleteBySessionId(session_id);
      
      if (result.deleted) {
        res.json({
          success: true,
          message: 'RAN equipment data deleted successfully',
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: 'No RAN equipment data found for this session'
          }
        });
      }
      
    } catch (error) {
      console.error('RAN Equipment DELETE Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  });

/**
 * Get equipment summary for a session
 * Returns a condensed overview of RAN equipment configuration
 */
router.get('/:session_id/summary', async (req, res) => {
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
    
    const summary = await RanEquipmentService.getEquipmentSummary(session_id);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('RAN Equipment Summary Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get cabinet options for dropdowns
 * Returns available cabinet options based on outdoor cabinets configuration
 */
router.get('/:session_id/cabinet-options', async (req, res) => {
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
    
    const options = await RanEquipmentService.getCabinetOptions(session_id);
    
    res.json({
      success: true,
      data: {
        session_id: session_id,
        cabinet_options: options,
        total_options: options.length
      }
    });
    
  } catch (error) {
    console.error('RAN Equipment Cabinet Options Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get vendor and model options for dropdowns
 */
router.get('/options/vendors-models', (req, res) => {
  try {
    const options = {
      vendors: ['Nokia', 'Ericsson', 'Huawei', 'ZTE', 'Other'],
      models: {
        Nokia: ['Nokia Air Scale', 'Nokia Felix'],
        Ericsson: ['Ericsson Baseband 6630', 'Ericsson Radio 4449'],
        Huawei: ['Huawei BBU5900', 'Huawei DBS3900'],
        ZTE: ['ZTE BBU', 'ZTE RRU'],
        Other: ['Other']
      },
      installation_options: [
        'Existing cabinet #1', 
        'New Nokia cabinet', 
        'Other'
      ]
    };
    
    res.json({
      success: true,
      data: options
    });
    
  } catch (error) {
    console.error('RAN Equipment Options Error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve vendor and model options'
      }
    });
  }
});

/**
 * Get equipment by vendor filter
 */
router.get('/:session_id/by-vendor', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { vendor } = req.query;
    
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
    
    // Validate vendor parameter
    const validVendors = ['Nokia', 'Ericsson', 'Huawei', 'ZTE', 'Other'];
    if (!vendor || !validVendors.includes(vendor)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: `vendor parameter must be one of: ${validVendors.join(', ')}`
        }
      });
    }
    
    const data = await RanEquipmentService.getOrCreateBySessionId(session_id);
    const filteredEquipment = data.ranEquipment.filter(eq => eq.existing_vendor === vendor);
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        vendor_filter: vendor,
        total_equipment_by_vendor: filteredEquipment.length,
        equipment: filteredEquipment
      }
    });
    
  } catch (error) {
    console.error('RAN Equipment By Vendor Error:', error);
    
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
    module: 'ran-equipment',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'dynamic_equipment_management',
      'outdoor_cabinets_sync',
      'vendor_tracking',
      'model_configuration',
      'installation_planning'
    ]
  });
});

module.exports = router; 