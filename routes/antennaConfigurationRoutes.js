const express = require('express');
const router = express.Router();
const AntennaConfiguration = require('../models/AntennaConfiguration');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const { Op } = require('sequelize');
const AntennaConfigurationService = require('../services/AntennaConfigurationService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const AntennaImageService = require('../services/AntennaImageService');

// Helper function to get cabinet count from OutdoorCabinets
const getCabinetCount = async (sessionId) => {
  try {
    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id: sessionId },
      attributes: ['number_of_cabinets']
    });
    return cabinet ? cabinet.number_of_cabinets : 0;
  } catch (error) {
    console.error('Error fetching cabinet count:', error);
    return 0;
  }
};

// Helper function to create default antenna structure
const getDefaultAntennaStructure = () => ({
  // Basic Information
  is_shared_site: false,
  operator: "",
  base_height: "",
  tower_leg: "",
  sector: 0,
  technology: [],
  
  // Angles and Tilt
  azimuth_angle: "",
  mechanical_tilt_exist: false,
  mechanical_tilt: "",
  electrical_tilt: "",
  
  // Connectivity and Vendor
  ret_connectivity: "",
  vendor: "",
  
  // Nokia Specific Fields
  is_active_antenna: false,
  nokia_module_name: "",
  nokia_fiber_count: 0,
  nokia_fiber_length: "",
  
  // Other Vendor Fields
  other_model_number: "",
  other_length: "",
  other_width: "",
  other_depth: "",
  other_port_types: [],
  other_bands: [],
  other_total_ports: 0,
  other_free_ports: 0,
  other_free_port_bands: [],
  other_connected_radio_units: 0,
  
  // Physical Measurements
  side_arm_length: "",
  side_arm_diameter: "",
  side_arm_offset: "",
  earth_cable_length: "",
  
  // Planning
  included_in_upgrade: false
});

// Helper function to create default response structure
const getDefaultResponseStructure = (sessionId, cabinetCount = 0) => ({
  session_id: sessionId,
  antenna_count: 0,
  antennas: [],
  created_at: null,
  updated_at: null,
  number_of_cabinets: cabinetCount
});

// Validation helper for antenna data
const validateAntennaData = (antenna, index) => {
  const errors = [];
  const antennaNum = index + 1;

  // Validate operator selection for shared sites
  if (antenna.is_shared_site && antenna.operator && !['Operator 1', 'Operator 2', 'Operator 3', 'Operator 4'].includes(antenna.operator)) {
    errors.push(`Antenna ${antennaNum}: Invalid operator selection`);
  }

  // Validate base height (numeric)
  if (antenna.base_height !== undefined && antenna.base_height !== null && antenna.base_height !== '' && isNaN(Number(antenna.base_height))) {
    errors.push(`Antenna ${antennaNum}: Base height must be a number`);
  }

  // Validate tower leg
  if (antenna.tower_leg && !['A', 'B', 'C', 'D'].includes(antenna.tower_leg)) {
    errors.push(`Antenna ${antennaNum}: Invalid tower leg selection`);
  }

  // Validate sector
  if (antenna.sector !== undefined && antenna.sector !== null && (antenna.sector < 1 || antenna.sector > 5)) {
    errors.push(`Antenna ${antennaNum}: Sector must be between 1 and 5`);
  }

  // Validate technology array
  if (antenna.technology && Array.isArray(antenna.technology)) {
    const validTechs = ['2G', '3G', '4G', '5G'];
    const invalidTechs = antenna.technology.filter(tech => !validTechs.includes(tech));
    if (invalidTechs.length > 0) {
      errors.push(`Antenna ${antennaNum}: Invalid technology selections: ${invalidTechs.join(', ')}`);
    }
  }

  // Validate angles (0-360 degrees)
  if (antenna.azimuth_angle !== undefined && antenna.azimuth_angle !== null && antenna.azimuth_angle !== '') {
    const azimuth = Number(antenna.azimuth_angle);
    if (isNaN(azimuth) || azimuth < 0 || azimuth > 360) {
      errors.push(`Antenna ${antennaNum}: Azimuth angle must be between 0 and 360 degrees`);
    }
  }

  // Validate tilt angles
  if (antenna.mechanical_tilt !== undefined && antenna.mechanical_tilt !== null && antenna.mechanical_tilt !== '' && isNaN(Number(antenna.mechanical_tilt))) {
    errors.push(`Antenna ${antennaNum}: Mechanical tilt must be a number`);
  }
  if (antenna.electrical_tilt !== undefined && antenna.electrical_tilt !== null && antenna.electrical_tilt !== '' && isNaN(Number(antenna.electrical_tilt))) {
    errors.push(`Antenna ${antennaNum}: Electrical tilt must be a number`);
  }

  // Validate RET connectivity
  if (antenna.ret_connectivity && !['Chaining', 'Direct', 'Not applicable'].includes(antenna.ret_connectivity)) {
    errors.push(`Antenna ${antennaNum}: Invalid RET connectivity selection`);
  }

  // Validate antenna vendor
  if (antenna.vendor && !['Nokia', 'PROS', 'COMMSCOPE', 'Kathrine', 'Huawei', 'Andrew', 'Other'].includes(antenna.vendor)) {
    errors.push(`Antenna ${antennaNum}: Invalid vendor selection`);
  }

  // Nokia-specific validations
  if (antenna.vendor === 'Nokia') {
    if (antenna.is_active_antenna && antenna.nokia_fiber_count !== undefined && antenna.nokia_fiber_count !== null && ![1, 2, 3, 4].includes(Number(antenna.nokia_fiber_count))) {
      errors.push(`Antenna ${antennaNum}: Nokia fiber count must be 1, 2, 3, or 4`);
    }
    if (antenna.is_active_antenna && antenna.nokia_fiber_length !== undefined && antenna.nokia_fiber_length !== null && antenna.nokia_fiber_length !== '' && isNaN(Number(antenna.nokia_fiber_length))) {
      errors.push(`Antenna ${antennaNum}: Nokia fiber length must be a number`);
    }
  }

  // Other vendor specific validations
  if (antenna.vendor === 'Other') {
    // Validate dimensions
    ['other_length', 'other_width', 'other_depth'].forEach(field => {
      if (antenna[field] !== undefined && antenna[field] !== null && antenna[field] !== '' && isNaN(Number(antenna[field]))) {
        errors.push(`Antenna ${antennaNum}: ${field.replace('other_', '')} must be a number`);
      }
    });

    // Validate port types
    if (antenna.other_port_types && Array.isArray(antenna.other_port_types)) {
      const validPortTypes = ['7/16', '4.3-10', 'MQ4', 'MQ5'];
      const invalidPortTypes = antenna.other_port_types.filter(type => !validPortTypes.includes(type));
      if (invalidPortTypes.length > 0) {
        errors.push(`Antenna ${antennaNum}: Invalid port types: ${invalidPortTypes.join(', ')}`);
      }
    }

    // Validate bands
    if (antenna.other_bands && Array.isArray(antenna.other_bands)) {
      const validBands = ['700', '800', '900', '1800', '2100', '2600'];
      const invalidBands = antenna.other_bands.filter(band => !validBands.includes(band));
      if (invalidBands.length > 0) {
        errors.push(`Antenna ${antennaNum}: Invalid bands: ${invalidBands.join(', ')}`);
      }
    }

    // Validate numeric fields
    ['other_total_ports', 'other_free_ports', 'other_connected_radio_units'].forEach(field => {
      if (antenna[field] !== undefined && antenna[field] !== null && antenna[field] !== '' && isNaN(Number(antenna[field]))) {
        errors.push(`Antenna ${antennaNum}: ${field.replace('other_', '')} must be a number`);
      }
    });
  }

  // Validate side arm measurements
  ['side_arm_length', 'side_arm_diameter', 'side_arm_offset'].forEach(field => {
    if (antenna[field] !== undefined && antenna[field] !== null && antenna[field] !== '' && isNaN(Number(antenna[field]))) {
      errors.push(`Antenna ${antennaNum}: ${field.replace('side_arm_', '')} must be a number`);
    }
  });

  // Validate earth cable length
  if (antenna.earth_cable_length !== undefined && antenna.earth_cable_length !== null && antenna.earth_cable_length !== '' && isNaN(Number(antenna.earth_cable_length))) {
    errors.push(`Antenna ${antennaNum}: Earth cable length must be a number`);
  }

  return errors;
};

/**
 * GET /api/antenna-configuration/:sessionId
 * Get Antenna Configuration data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await AntennaConfigurationService.getOrCreateBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Antenna Configuration data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting Antenna Configuration data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve Antenna Configuration data'
      }
    });
  }
});

/**
 * PUT /api/antenna-configuration/:sessionId
 * Update Antenna Configuration data and handle image uploads
 */
router.put('/:sessionId', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let updateData = req.body;

    // Parse antenna_data if it's a string
    if (typeof updateData.antenna_data === 'string') {
      try {
        updateData = JSON.parse(updateData.antenna_data);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: { type: 'VALIDATION_ERROR', message: 'Invalid antenna_data JSON format' }
        });
      }
    }

    // Validate that we have data to update
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'No valid data provided for update' }
      });
    }

    // Check if antennas exists and is an array
    if (!updateData.antennas || !Array.isArray(updateData.antennas)) {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'antennas is required and must be an array' }
      });
    }

    // Validate each antenna in the array
    for (let i = 0; i < updateData.antennas.length; i++) {
      const antenna = updateData.antennas[i];
      
      if (!antenna || typeof antenna !== 'object') {
        return res.status(400).json({
          success: false,
          error: { type: 'VALIDATION_ERROR', message: `Antenna at index ${i} must be an object` }
        });
      }
    }

    // Update Antenna Configuration data
    let result = await AntennaConfigurationService.getOrCreateBySessionId(sessionId, updateData);

    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          let antenna_number;
          
          // Parse antenna number from field name (e.g., antenna_1_front)
          const match = field.match(/antenna_(\d+)_/);
          
          if (!match) {
            throw new Error(`Invalid field name format: ${field}. Expected antenna_X_* format`);
          }
          
          antenna_number = parseInt(match[1], 10);
          
          if (!antenna_number || antenna_number > updateData.antennas.length) {
            throw new Error(`Invalid antenna number ${antenna_number} in field ${field}. Must be between 1 and ${updateData.antennas.length}`);
          }

          const replaceRes = await AntennaImageService.replaceImage({
            file,
            session_id: sessionId,
            antenna_number,
            image_category: field,
            description: updateData[`${field}_description`] || null
          });
          imageResults.push({ field, success: true, data: replaceRes.data });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field: file.fieldname, success: false, error: err.message });
        }
      }
      
      // Refresh result to include updated images
      result = await AntennaConfigurationService.getOrCreateBySessionId(sessionId);
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    const response = {
      success: !hasImageUploadFailures,
      data: result,
      message: 'Antenna Configuration data updated successfully'
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
      
      if (hasImageUploadFailures) {
        response.message = `Antenna Configuration data updated but ${failCount} image upload(s) failed`;
      } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error updating Antenna Configuration data:', error);
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
                      
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update Antenna Configuration data'
      }
    });
  }
});

/**
 * DELETE /api/antenna-configuration/:sessionId
 * Delete Antenna Configuration data and associated images
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await AntennaConfigurationService.deleteBySessionId(sessionId);

    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'Antenna Configuration not found' }
      });
    }

    res.json({
      success: true,
      message: 'Antenna Configuration deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting Antenna Configuration:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete Antenna Configuration'
      }
    });
  }
});

module.exports = router; 