const express = require('express');
const router = express.Router();
const AntennaConfiguration = require('../models/AntennaConfiguration');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const { Op } = require('sequelize');

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

// GET /api/antenna-configuration/:session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { with_defaults } = req.query; // New query parameter

    const [antennaConfig, cabinetCount] = await Promise.all([
      AntennaConfiguration.findOne({
        where: { session_id }
      }),
      getCabinetCount(session_id)
    ]);

    if (!antennaConfig) {
      // Return default structure with empty strings and 0 values
      return res.json(getDefaultResponseStructure(session_id, cabinetCount));
    }

    // If with_defaults=true is passed, ensure antennas have all default fields
    let antennas = antennaConfig.antennas || [];
    if (with_defaults === 'true') {
      antennas = antennas.map(antenna => ({
        ...getDefaultAntennaStructure(),
        ...antenna
      }));
    }

    const response = {
      session_id: antennaConfig.session_id,
      antenna_count: antennaConfig.antenna_count || 0,
      antennas: antennas,
      created_at: antennaConfig.created_at,
      updated_at: antennaConfig.updated_at,
      number_of_cabinets: cabinetCount
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching antenna configuration:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/antenna-configuration/default/antenna-structure
router.get('/default/antenna-structure', async (req, res) => {
  try {
    // Return a single default antenna structure for frontend use
    const defaultAntenna = getDefaultAntennaStructure();
    res.json(defaultAntenna);
  } catch (error) {
    console.error('Error getting default antenna structure:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /api/antenna-configuration/:session_id
router.post('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { antenna_count, antennas } = req.body;

    // Validate antenna count
    if (antenna_count !== undefined && (antenna_count < 1 || antenna_count > 15)) {
      return res.status(400).json({ error: 'Antenna count must be between 1 and 15' });
    }

    // Validate antennas array
    let validationErrors = [];
    if (antennas && Array.isArray(antennas)) {
      antennas.forEach((antenna, index) => {
        const errors = validateAntennaData(antenna, index);
        validationErrors = validationErrors.concat(errors);
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation errors', details: validationErrors });
    }

    const [antennaConfig, created] = await AntennaConfiguration.upsert({
      session_id,
      antenna_count: antenna_count || 0,
      antennas: antennas || [],
      updated_at: new Date()
    });

    const cabinetCount = await getCabinetCount(session_id);

    const response = {
      session_id: antennaConfig.session_id,
      antenna_count: antennaConfig.antenna_count,
      antennas: antennaConfig.antennas,
      created_at: antennaConfig.created_at,
      updated_at: antennaConfig.updated_at,
      number_of_cabinets: cabinetCount
    };

    res.status(created ? 201 : 200).json(response);
  } catch (error) {
    console.error('Error creating/updating antenna configuration:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /api/antenna-configuration/:session_id (Full update)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { antenna_count, antennas } = req.body;

    // Validate antenna count
    if (antenna_count !== undefined && (antenna_count < 1 || antenna_count > 15)) {
      return res.status(400).json({ error: 'Antenna count must be between 1 and 15' });
    }

    // Validate antennas array
    let validationErrors = [];
    if (antennas && Array.isArray(antennas)) {
      antennas.forEach((antenna, index) => {
        const errors = validateAntennaData(antenna, index);
        validationErrors = validationErrors.concat(errors);
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation errors', details: validationErrors });
    }

    const [antennaConfig, created] = await AntennaConfiguration.upsert({
      session_id,
      antenna_count: antenna_count || 0,
      antennas: antennas || [],
      updated_at: new Date()
    });

    const cabinetCount = await getCabinetCount(session_id);

    const response = {
      session_id: antennaConfig.session_id,
      antenna_count: antennaConfig.antenna_count,
      antennas: antennaConfig.antennas,
      created_at: antennaConfig.created_at,
      updated_at: antennaConfig.updated_at,
      number_of_cabinets: cabinetCount
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating antenna configuration:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PATCH /api/antenna-configuration/:session_id (Partial update)
router.patch('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const updateData = req.body;

    // Find existing configuration
    let antennaConfig = await AntennaConfiguration.findOne({
      where: { session_id }
    });

    if (!antennaConfig) {
      // Create new if doesn't exist
      antennaConfig = await AntennaConfiguration.create({
        session_id,
        antenna_count: 0,
        antennas: []
      });
    }

    // Validate antenna count if provided
    if (updateData.antenna_count !== undefined && (updateData.antenna_count < 1 || updateData.antenna_count > 15)) {
      return res.status(400).json({ error: 'Antenna count must be between 1 and 15' });
    }

    // Validate antennas if provided
    let validationErrors = [];
    if (updateData.antennas && Array.isArray(updateData.antennas)) {
      updateData.antennas.forEach((antenna, index) => {
        const errors = validateAntennaData(antenna, index);
        validationErrors = validationErrors.concat(errors);
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation errors', details: validationErrors });
    }

    // Update only provided fields
    const fieldsToUpdate = {};
    if (updateData.antenna_count !== undefined) fieldsToUpdate.antenna_count = updateData.antenna_count;
    if (updateData.antennas !== undefined) fieldsToUpdate.antennas = updateData.antennas;
    fieldsToUpdate.updated_at = new Date();

    await antennaConfig.update(fieldsToUpdate);

    const cabinetCount = await getCabinetCount(session_id);

    const response = {
      session_id: antennaConfig.session_id,
      antenna_count: antennaConfig.antenna_count,
      antennas: antennaConfig.antennas,
      created_at: antennaConfig.created_at,
      updated_at: antennaConfig.updated_at,
      number_of_cabinets: cabinetCount
    };

    res.json(response);
  } catch (error) {
    console.error('Error partially updating antenna configuration:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PATCH /api/antenna-configuration/:session_id/antenna/:antenna_index (Update specific antenna)
router.patch('/:session_id/antenna/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const antennaData = req.body;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid antenna index' });
    }

    // Find existing configuration
    let antennaConfig = await AntennaConfiguration.findOne({
      where: { session_id }
    });

    if (!antennaConfig) {
      return res.status(404).json({ error: 'Antenna configuration not found' });
    }

    // Validate antenna data
    const validationErrors = validateAntennaData(antennaData, index);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation errors', details: validationErrors });
    }

    // Update specific antenna
    const antennas = antennaConfig.antennas || [];
    
    // Ensure array is large enough
    while (antennas.length <= index) {
      antennas.push({});
    }

    // Merge new data with existing antenna data
    antennas[index] = { ...antennas[index], ...antennaData };

    await antennaConfig.update({
      antennas,
      updated_at: new Date()
    });

    const cabinetCount = await getCabinetCount(session_id);

    const response = {
      session_id: antennaConfig.session_id,
      antenna_count: antennaConfig.antenna_count,
      antennas: antennaConfig.antennas,
      created_at: antennaConfig.created_at,
      updated_at: antennaConfig.updated_at,
      number_of_cabinets: cabinetCount
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating specific antenna:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /api/antenna-configuration/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const deleted = await AntennaConfiguration.destroy({
      where: { session_id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Antenna configuration not found' });
    }

    res.json({ message: 'Antenna configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting antenna configuration:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router; 