const express = require('express');
const router = express.Router();
const OutdoorCabinetsService = require('../services/OutdoorCabinetsService');

/**
 * Main endpoint for Outdoor Cabinets Info
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
      
      const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      console.error('Outdoor Cabinets GET Error:', error);
      
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
      
      const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id, updateData);
      
      res.json({
        success: true,
        data,
        message: 'Outdoor cabinets info updated successfully'
      });
      
    } catch (error) {
      console.error('Outdoor Cabinets PUT Error:', error);
      
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
      
      const result = await OutdoorCabinetsService.deleteBySessionId(session_id);
      
      if (result.deleted) {
        res.json({
          success: true,
          message: 'Outdoor cabinets data deleted successfully',
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: 'No outdoor cabinets data found for this session'
          }
        });
      }
      
    } catch (error) {
      console.error('Outdoor Cabinets DELETE Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  });

/**
 * Get cabinet summary for a session
 * Returns a condensed overview of cabinet configuration
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
    
    const summary = await OutdoorCabinetsService.getCabinetSummary(session_id);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Outdoor Cabinets Summary Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get cabinets with specific equipment
 * Query parameters: equipment (blvd, llvd, pdu, ac_power)
 */
router.get('/:session_id/by-equipment', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { equipment } = req.query;
    
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
    
    // Validate equipment parameter
    const validEquipment = ['blvd', 'llvd', 'pdu', 'ac_power'];
    if (!equipment || !validEquipment.includes(equipment)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: `equipment parameter must be one of: ${validEquipment.join(', ')}`
        }
      });
    }
    
    const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);
    const activeCabinets = data.cabinets.slice(0, data.numberOfCabinets || 0);
    
    let filteredCabinets = [];
    
    switch (equipment) {
      case 'blvd':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.blvd === 'Yes');
        break;
      case 'llvd':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.llvd === 'Yes');
        break;
      case 'pdu':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.pdu === 'Yes');
        break;
      case 'ac_power':
        filteredCabinets = activeCabinets.filter(cabinet => cabinet.acPowerFeed === 'Yes');
        break;
    }
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        equipment_type: equipment,
        total_cabinets_with_equipment: filteredCabinets.length,
        cabinets: filteredCabinets
      }
    });
    
  } catch (error) {
    console.error('Outdoor Cabinets By Equipment Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * Get all cabinet vendors used in a session
 */
router.get('/:session_id/vendors', async (req, res) => {
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
    
    const data = await OutdoorCabinetsService.getOrCreateBySessionId(session_id);
    const activeCabinets = data.cabinets.slice(0, data.numberOfCabinets || 0);
    
    const vendors = [...new Set(
      activeCabinets
        .map(cabinet => cabinet.vendor)
        .filter(vendor => vendor && vendor.trim() !== '')
    )];
    
    res.json({
      success: true,
      data: {
        session_id: data.session_id,
        vendors: vendors,
        total_unique_vendors: vendors.length
      }
    });
    
  } catch (error) {
    console.error('Outdoor Cabinets Vendors Error:', error);
    
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
    module: 'outdoor-cabinets',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'cabinet_configuration_management',
      'equipment_tracking',
      'power_distribution_management',
      'space_utilization_tracking',
      'vendor_analytics'
    ]
  });
});

module.exports = router; 