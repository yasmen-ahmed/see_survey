const express = require('express');
const router = express.Router();
const NewRadioUnits = require('../models/NewRadioUnits');
const NewRadioInstallations = require('../models/NewRadioInstallations');

// Validation helper for new radio units data
const validateNewRadioUnitData = (data) => {
  const validSectors = ['1', '2', '3', '4', '5', '6'];
  const validAntennaConnection = ['New', 'Existing'];
  const validTechnologies = ['2G', '3G', '4G', '5G'];
  const validLocations = ['Tower leg A', 'Tower leg B', 'Tower leg C', 'Tower leg D', 'On the ground'];
  const validTowerSections = ['Angular', 'Tubular'];
  const validSideArmTypes = ['Use existing empty side arm', 'Use existing antenna side arm', 'New side arm need to be supplied'];
  const validDcPowerSources = ['Direct from rectifier distribution', 'New FPFH', 'Existing FPFH', 'Existing DC PDU (not FPFH)'];
  const validYesNo = ['Yes', 'No'];

  // Validate enum fields
  if (data.new_radio_unit_sector && !validSectors.includes(data.new_radio_unit_sector)) {
    throw new Error(`Invalid new_radio_unit_sector: ${data.new_radio_unit_sector}`);
  }
  
  if (data.connected_to_antenna && !validAntennaConnection.includes(data.connected_to_antenna)) {
    throw new Error(`Invalid connected_to_antenna: ${data.connected_to_antenna}`);
  }
  
  if (data.radio_unit_location && !validLocations.includes(data.radio_unit_location)) {
    throw new Error(`Invalid radio_unit_location: ${data.radio_unit_location}`);
  }
  
  if (data.tower_leg_section && !validTowerSections.includes(data.tower_leg_section)) {
    throw new Error(`Invalid tower_leg_section: ${data.tower_leg_section}`);
  }
  
  if (data.side_arm_type && !validSideArmTypes.includes(data.side_arm_type)) {
    throw new Error(`Invalid side_arm_type: ${data.side_arm_type}`);
  }
  
  if (data.dc_power_source && !validDcPowerSources.includes(data.dc_power_source)) {
    throw new Error(`Invalid dc_power_source: ${data.dc_power_source}`);
  }
  
  if (data.earth_bus_bar_exists && !validYesNo.includes(data.earth_bus_bar_exists)) {
    throw new Error(`Invalid earth_bus_bar_exists: ${data.earth_bus_bar_exists}`);
  }

  // Validate connected antenna technology array
  if (data.connected_antenna_technology && Array.isArray(data.connected_antenna_technology)) {
    data.connected_antenna_technology.forEach(tech => {
      if (!validTechnologies.includes(tech)) {
        throw new Error(`Invalid connected_antenna_technology: ${tech}`);
      }
    });
  }

  // Validate numeric fields
  const numericFields = [
    'radio_unit_number', 'feeder_length_to_antenna', 'angular_l1_dimension',
    'angular_l2_dimension', 'tubular_cross_section', 'side_arm_length',
    'side_arm_cross_section', 'side_arm_offset', 'dc_power_cable_length',
    'fiber_cable_length', 'jumper_length', 'earth_cable_length'
  ];
  
  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      if (isNaN(data[field]) || data[field] < 0) {
        throw new Error(`${field} must be a positive number`);
      }
    }
  });

  // Validate radio_unit_index
  if (data.radio_unit_index !== undefined && data.radio_unit_index !== null) {
    if (!Number.isInteger(data.radio_unit_index) || data.radio_unit_index < 1) {
      throw new Error('radio_unit_index must be a positive integer starting from 1');
    }
  }
};

// Helper function to get planning data from NewRadioInstallations
const getPlanningData = async (sessionId) => {
  try {
    const radioInstallations = await NewRadioInstallations.findOne({
      where: { session_id: sessionId },
      attributes: ['new_radio_units_planned', 'existing_radio_units_swapped']
    });
    
    return {
      new_radio_units_planned: radioInstallations ? radioInstallations.new_radio_units_planned : 1,
      existing_radio_units_swapped: radioInstallations ? radioInstallations.existing_radio_units_swapped : 1
    };
  } catch (error) {
    console.warn(`Could not fetch planning data for session ${sessionId}:`, error.message);
    return {
      new_radio_units_planned: 1,
      existing_radio_units_swapped: 1
    };
  }
};

// Helper function to format radio units data with default empty strings
const formatRadioUnitsData = (radioUnits, sessionId) => {
  if (!radioUnits) {
    return {
      id: null,
      session_id: sessionId,
      radio_unit_index: 1,
      radio_unit_number: '',
      new_radio_unit_sector: '',
      connected_to_antenna: '',
      connected_antenna_technology: [],
      new_radio_unit_model: '',
      radio_unit_location: '',
      feeder_length_to_antenna: '',
      tower_leg_section: '',
      angular_l1_dimension: '',
      angular_l2_dimension: '',
      tubular_cross_section: '',
      side_arm_type: '',
      side_arm_length: '',
      side_arm_cross_section: '',
      side_arm_offset: '',
      dc_power_source: '',
      dc_power_cable_length: '',
      fiber_cable_length: '',
      jumper_length: '',
      earth_bus_bar_exists: '',
      earth_cable_length: '',
      created_at: null,
      updated_at: null
    };
  }

  const data = radioUnits.toJSON();
  
  // Convert null values to empty strings for string fields
  const stringFields = [
    'new_radio_unit_sector', 'connected_to_antenna', 'new_radio_unit_model',
    'radio_unit_location', 'tower_leg_section', 'side_arm_type',
    'dc_power_source', 'earth_bus_bar_exists'
  ];
  
  const numericFields = [
    'radio_unit_number', 'feeder_length_to_antenna', 'angular_l1_dimension',
    'angular_l2_dimension', 'tubular_cross_section', 'side_arm_length',
    'side_arm_cross_section', 'side_arm_offset', 'dc_power_cable_length',
    'fiber_cable_length', 'jumper_length', 'earth_cable_length'
  ];

  stringFields.forEach(field => {
    if (data[field] === null || data[field] === undefined) {
      data[field] = '';
    }
  });

  numericFields.forEach(field => {
    if (data[field] === null || data[field] === undefined) {
      data[field] = '';
    }
  });

  // Ensure connected_antenna_technology is always an array
  if (!Array.isArray(data.connected_antenna_technology)) {
    data.connected_antenna_technology = [];
  }

  return data;
};

// Helper function to format multiple radio units data
const formatMultipleRadioUnitsData = (radioUnitsArray, sessionId, plannedCount) => {
  const result = [];
  
  // Create a map of existing radio units by index
  const existingUnitsMap = new Map();
  if (radioUnitsArray && radioUnitsArray.length > 0) {
    radioUnitsArray.forEach(unit => {
      existingUnitsMap.set(unit.radio_unit_index, unit);
    });
  }
  
  // Generate data for all planned radio units
  for (let i = 1; i <= plannedCount; i++) {
    const existingUnit = existingUnitsMap.get(i);
    result.push(formatRadioUnitsData(existingUnit, sessionId));
  }
  
  return result;
};

// GET /api/new-radio-units/:session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get planning data and existing radio units data in parallel
    const [planningData, radioUnits] = await Promise.all([
      getPlanningData(session_id),
      NewRadioUnits.findAll({ 
        where: { session_id },
        order: [['radio_unit_index', 'ASC']]
      })
    ]);

    const formattedData = formatMultipleRadioUnitsData(
      radioUnits, 
      session_id, 
      planningData.new_radio_units_planned
    );

    res.json({
      session_id,
      ...planningData,
      data: formattedData,
      has_data: radioUnits && radioUnits.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/new-radio-units/:session_id
// Handle both single object and array of objects
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const requestData = req.body;

    // Determine if we're dealing with single object or array
    const radioUnitsArray = Array.isArray(requestData) ? requestData : [requestData];

    // Validate all radio units data
    radioUnitsArray.forEach((radioUnitsData, index) => {
      try {
        validateNewRadioUnitData(radioUnitsData);
      } catch (error) {
        throw new Error(`Validation error for radio unit ${index + 1}: ${error.message}`);
      }
    });

    // Delete existing radio units for this session
    await NewRadioUnits.destroy({
      where: { session_id }
    });

    // Create new radio units
    const createdUnits = [];
    for (let i = 0; i < radioUnitsArray.length; i++) {
      const radioUnitsData = radioUnitsArray[i];
      
      // Ensure radio_unit_index is set
      if (!radioUnitsData.radio_unit_index) {
        radioUnitsData.radio_unit_index = i + 1;
      }

      const radioUnit = await NewRadioUnits.create({
        session_id,
        ...radioUnitsData
      });
      createdUnits.push(radioUnit);
    }

    // Get planning data for response
    const planningData = await getPlanningData(session_id);

    const formattedData = formatMultipleRadioUnitsData(
      createdUnits, 
      session_id, 
      planningData.new_radio_units_planned
    );

    res.json({
      message: `New radio units for session ${session_id} updated successfully`,
      session_id,
      ...planningData,
      data: formattedData,
      units_created: createdUnits.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/new-radio-units/:session_id
// Handle partial updates for multiple radio units
router.patch('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const requestData = req.body;

    // Determine if we're dealing with single object or array
    const updateArray = Array.isArray(requestData) ? requestData : [requestData];

    // Validate all update data
    updateArray.forEach((updateData, index) => {
      try {
        validateNewRadioUnitData(updateData);
      } catch (error) {
        throw new Error(`Validation error for radio unit ${index + 1}: ${error.message}`);
      }
    });

    const updatedUnits = [];
    for (let i = 0; i < updateArray.length; i++) {
      const updateData = updateArray[i];
      
      // Determine radio_unit_index
      const radioUnitIndex = updateData.radio_unit_index || (i + 1);

      let radioUnit = await NewRadioUnits.findOne({
        where: { 
          session_id,
          radio_unit_index: radioUnitIndex
        }
      });

      if (!radioUnit) {
        // Create new radio unit with provided data
        radioUnit = await NewRadioUnits.create({
          session_id,
          radio_unit_index: radioUnitIndex,
          ...updateData
        });
      } else {
        // Only update provided fields
        await radioUnit.update(updateData);
      }
      updatedUnits.push(radioUnit);
    }

    // Get all radio units for response
    const allRadioUnits = await NewRadioUnits.findAll({ 
      where: { session_id },
      order: [['radio_unit_index', 'ASC']]
    });

    // Get planning data for response
    const planningData = await getPlanningData(session_id);

    const formattedData = formatMultipleRadioUnitsData(
      allRadioUnits, 
      session_id, 
      planningData.new_radio_units_planned
    );

    res.json({
      message: `New radio units for session ${session_id} partially updated successfully`,
      session_id,
      ...planningData,
      data: formattedData,
      units_updated: updatedUnits.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/new-radio-units/:session_id/:radio_unit_index
// Update specific radio unit by index
router.patch('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const updateData = req.body;

    // Validate radio_unit_index
    const unitIndex = parseInt(radio_unit_index);
    if (!Number.isInteger(unitIndex) || unitIndex < 1) {
      return res.status(400).json({ 
        error: 'radio_unit_index must be a positive integer starting from 1' 
      });
    }

    // Validate update data
    try {
      validateNewRadioUnitData(updateData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    let radioUnit = await NewRadioUnits.findOne({
      where: { 
        session_id,
        radio_unit_index: unitIndex
      }
    });

    if (!radioUnit) {
      // Create new radio unit with provided data
      radioUnit = await NewRadioUnits.create({
        session_id,
        radio_unit_index: unitIndex,
        ...updateData
      });
    } else {
      // Only update provided fields
      await radioUnit.update(updateData);
    }

    // Get planning data for response
    const planningData = await getPlanningData(session_id);

    res.json({
      message: `Radio unit ${unitIndex} for session ${session_id} updated successfully`,
      session_id,
      radio_unit_index: unitIndex,
      ...planningData,
      data: formatRadioUnitsData(radioUnit, session_id)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/new-radio-units/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const deletedCount = await NewRadioUnits.destroy({
      where: { session_id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ 
        error: `No radio units found for session ${session_id}` 
      });
    }

    res.json({
      message: `${deletedCount} radio units for session ${session_id} deleted successfully`,
      deleted_count: deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/new-radio-units/:session_id/:radio_unit_index
// Delete specific radio unit by index
router.delete('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;

    // Validate radio_unit_index
    const unitIndex = parseInt(radio_unit_index);
    if (!Number.isInteger(unitIndex) || unitIndex < 1) {
      return res.status(400).json({ 
        error: 'radio_unit_index must be a positive integer starting from 1' 
      });
    }

    const deletedCount = await NewRadioUnits.destroy({
      where: { 
        session_id,
        radio_unit_index: unitIndex
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ 
        error: `Radio unit ${unitIndex} not found for session ${session_id}` 
      });
    }

    res.json({
      message: `Radio unit ${unitIndex} for session ${session_id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-radio-units/:session_id/config
// Returns configuration data including planning information
router.get('/:session_id/config', async (req, res) => {
  try {
    const { session_id } = req.params;

    const [radioInstallations, radioUnitsCount] = await Promise.all([
      NewRadioInstallations.findOne({
        where: { session_id },
        attributes: ['new_radio_units_planned', 'existing_radio_units_swapped']
      }),
      NewRadioUnits.count({ where: { session_id } })
    ]);

    res.json({
      session_id,
      new_radio_units_planned: radioInstallations ? radioInstallations.new_radio_units_planned : 1,
      existing_radio_units_swapped: radioInstallations ? radioInstallations.existing_radio_units_swapped : 1,
      radio_units_count: radioUnitsCount,
      has_radio_units_data: radioUnitsCount > 0,
      has_radio_installations_data: !!radioInstallations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
