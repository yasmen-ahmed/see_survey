const express = require('express');
const router = express.Router();
const NewRadioUnits = require('../models/NewRadioUnits');
const NewRadioInstallations = require('../models/NewRadioInstallations');

// Simple data converter for database compatibility (no validation)
const convertDataForDB = (data) => {
  const converted = { ...data };
  
  // Ensure radio_unit_index is properly set and is a number
  if (converted.radio_unit_index) {
    converted.radio_unit_index = parseInt(converted.radio_unit_index);
  }
  
  // Convert empty strings to null for numeric fields to prevent database errors
  const numericFields = [
    'radio_unit_number', 'feeder_length_to_antenna', 'angular_l1_dimension',
    'angular_l2_dimension', 'tubular_cross_section', 'side_arm_length',
    'side_arm_cross_section', 'side_arm_offset', 'dc_power_cable_length',
    'fiber_cable_length', 'jumper_length', 'earth_cable_length'
  ];
  
  numericFields.forEach(field => {
    if (converted[field] === '' || converted[field] === undefined || converted[field] === null) {
      converted[field] = null;
    } else if (converted[field] && !isNaN(converted[field])) {
      // Convert valid numbers to proper format
      converted[field] = parseFloat(converted[field]);
    }
  });

  // Convert empty strings to null for ENUM-like fields to prevent database errors
  const enumFields = [
    'new_radio_unit_sector', 'connected_to_antenna', 'radio_unit_location',
    'tower_leg_section', 'side_arm_type', 'dc_power_source', 'earth_bus_bar_exists'
  ];
  
  enumFields.forEach(field => {
    if (converted[field] === '' || converted[field] === undefined) {
      converted[field] = null;
    }
  });

  // Handle connected_antenna_technology array
  if (converted.connected_antenna_technology && !Array.isArray(converted.connected_antenna_technology)) {
    converted.connected_antenna_technology = [];
  }

  // Remove any undefined or null keys to clean up the object
  Object.keys(converted).forEach(key => {
    if (converted[key] === undefined) {
      delete converted[key];
    }
  });

  return converted;
};

// Helper function to get new_radio_units_planned from NewRadioInstallations
const getNewRadioUnitsPlanned = async (sessionId) => {
  try {
    const radioInstallations = await NewRadioInstallations.findOne({
      where: { session_id: sessionId },
      attributes: ['new_radio_units_planned']
    });
    
    return radioInstallations ? radioInstallations.new_radio_units_planned : 1;
  } catch (error) {
    console.warn(`Could not fetch new_radio_units_planned for session ${sessionId}:`, error.message);
    return 1;
  }
};

// Helper function to create default empty radio unit data
const getDefaultRadioUnitData = (sessionId, radioUnitIndex) => {
  return {
    id: null,
    session_id: sessionId,
    radio_unit_index: radioUnitIndex,
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
};

// Helper function to format radio unit data with default empty strings
const formatRadioUnitData = (radioUnit, sessionId, radioUnitIndex) => {
  if (!radioUnit) {
    return getDefaultRadioUnitData(sessionId, radioUnitIndex);
  }

  const data = radioUnit.toJSON();
  
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

// GET /api/new-radio-units/:session_id
// Returns array based on new_radio_units_planned count with empty objects for missing ones
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get the planned radio unit count and existing radio units
    const [newRadioUnitsPlanned, existingRadioUnits] = await Promise.all([
      getNewRadioUnitsPlanned(session_id),
      NewRadioUnits.findAll({
        where: { session_id },
        order: [['radio_unit_index', 'ASC']]
      })
    ]);

    // Create array with the expected number of radio units (filling missing ones with empty data)
    const formattedRadioUnits = [];
    for (let i = 1; i <= newRadioUnitsPlanned; i++) {
      const existingRadioUnit = existingRadioUnits.find(unit => unit.radio_unit_index === i);
      formattedRadioUnits.push(formatRadioUnitData(existingRadioUnit, session_id, i));
    }

    res.json({
      session_id,
      new_radio_units_planned: newRadioUnitsPlanned,
      radio_units: formattedRadioUnits,
      total_radio_units: formattedRadioUnits.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-radio-units/:session_id/:radio_unit_index
// Returns specific radio unit or default empty data if not exists
router.get('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    const radioUnit = await NewRadioUnits.findOne({
      where: { 
        session_id,
        radio_unit_index: index
      }
    });

    const formattedData = formatRadioUnitData(radioUnit, session_id, index);
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/new-radio-units/:session_id/:radio_unit_index
router.post('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const radioUnitData = req.body;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    // Convert data for database compatibility
    const convertedData = convertDataForDB(radioUnitData);

    // Check if radio unit already exists
    let radioUnit = await NewRadioUnits.findOne({
      where: { 
        session_id,
        radio_unit_index: index
      }
    });

    if (radioUnit) {
      // Update existing radio unit
      await radioUnit.update(convertedData);
      res.json({
        message: `Radio unit ${index} updated successfully`,
        data: formatRadioUnitData(radioUnit, session_id, index)
      });
    } else {
      // Create new radio unit
      radioUnit = await NewRadioUnits.create({
        session_id,
        radio_unit_index: index,
        ...convertedData
      });
      res.status(201).json({
        message: `Radio unit ${index} created successfully`,
        data: formatRadioUnitData(radioUnit, session_id, index)
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-units/:session_id (bulk update/create radio units array)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const radioUnitsArray = req.body.radio_units || [];

    if (!Array.isArray(radioUnitsArray)) {
      return res.status(400).json({ error: 'Request body must contain a radio_units array' });
    }

    const results = [];

    // Process each radio unit in the array
    for (let i = 0; i < radioUnitsArray.length; i++) {
      const radioUnitData = radioUnitsArray[i];
      const radioUnitIndex = radioUnitData.radio_unit_index || (i + 1);

      try {
        // Convert data for database compatibility
        const convertedData = convertDataForDB(radioUnitData);
       
        // Check if radio unit exists
        let radioUnit = await NewRadioUnits.findOne({
          where: { 
            session_id,
            radio_unit_index: radioUnitIndex
          }
        });

        if (radioUnit) {
          // Update existing radio unit
          await radioUnit.update(convertedData);
        } else {
          // Create new radio unit
          radioUnit = await NewRadioUnits.create({
            session_id,
            radio_unit_index: radioUnitIndex,
            ...convertedData
          });
        }

        results.push({
          radio_unit_index: radioUnitIndex,
          status: 'success',
          data: formatRadioUnitData(radioUnit, session_id, radioUnitIndex)
        });
      } catch (error) {
        results.push({
          radio_unit_index: radioUnitIndex,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      message: `Processed ${radioUnitsArray.length} radio units for session ${session_id}`,
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-units/:session_id/:radio_unit_index
router.put('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const radioUnitData = req.body;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    // Convert data for database compatibility
    const convertedData = convertDataForDB(radioUnitData);

    let radioUnit = await NewRadioUnits.findOne({
      where: { 
        session_id,
        radio_unit_index: index
      }
    });

    if (!radioUnit) {
      // Create new radio unit if it doesn't exist
      radioUnit = await NewRadioUnits.create({
        session_id,
        radio_unit_index: index,
        ...convertedData
      });
    } else {
      // Update existing radio unit (complete replacement)
      await radioUnit.update(convertedData);
    }

    res.json({
      message: `Radio unit ${index} updated successfully`,
      data: formatRadioUnitData(radioUnit, session_id, index)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/new-radio-units/:session_id/:radio_unit_index
router.patch('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const updateData = req.body;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    // Convert data for database compatibility
    const convertedData = convertDataForDB(updateData);

    let radioUnit = await NewRadioUnits.findOne({
      where: { 
        session_id,
        radio_unit_index: index
      }
    });

    if (!radioUnit) {
      // Create new radio unit with provided data
      radioUnit = await NewRadioUnits.create({
        session_id,
        radio_unit_index: index,
        ...convertedData
      });
    } else {
      // Only update provided fields
      await radioUnit.update(convertedData);
    }

    res.json({
      message: `Radio unit ${index} partially updated successfully`,
      data: formatRadioUnitData(radioUnit, session_id, index)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/new-radio-units/:session_id/:radio_unit_index
router.delete('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    const radioUnit = await NewRadioUnits.findOne({
      where: { 
        session_id,
        radio_unit_index: index
      }
    });

    if (!radioUnit) {
      return res.status(404).json({ 
        error: `Radio unit ${index} not found for session ${session_id}` 
      });
    }

    await radioUnit.destroy();

    res.json({
      message: `Radio unit ${index} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/new-radio-units/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const deletedCount = await NewRadioUnits.destroy({
      where: { session_id }
    });

    res.json({
      message: `All radio units for session ${session_id} deleted successfully`,
      deleted_count: deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-radio-units/:session_id/config
// Returns configuration data including new_radio_units_planned
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
      current_radio_units_count: radioUnitsCount,
      has_radio_installations_data: !!radioInstallations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
