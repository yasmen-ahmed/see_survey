const express = require('express');
const router = express.Router();
const NewFPFHs = require('../models/NewFPFHs');
const NewRadioInstallations = require('../models/NewRadioInstallations');

// Simple data converter for database compatibility (no validation)
const convertDataForDB = (data) => {
  const converted = { ...data };
  
  // Ensure fpfh_index is properly set and is a number
  if (converted.fpfh_index) {
    converted.fpfh_index = parseInt(converted.fpfh_index);
  }
  
  // Convert empty strings to null for numeric fields to prevent database errors
  const numericFields = [
    'fpfh_number', 'fpfh_base_height', 'ethernet_cable_length',
    'dc_power_cable_length', 'earth_cable_length'
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
    'fpfh_installation_type', 'fpfh_location', 'fpfh_tower_leg',
    'fpfh_dc_power_source', 'dc_distribution_source', 'earth_bus_bar_exists'
  ];
  
  enumFields.forEach(field => {
    if (converted[field] === '' || converted[field] === undefined) {
      converted[field] = null;
    }
  });

  // Remove any undefined or null keys to clean up the object
  Object.keys(converted).forEach(key => {
    if (converted[key] === undefined) {
      delete converted[key];
    }
  });

  return converted;
};

// Helper function to get planning data from NewRadioInstallations
const getNewFPFHInstalled = async (sessionId) => {
  try {
    const radioInstallations = await NewRadioInstallations.findOne({
      where: { session_id: sessionId },
      attributes: ['new_fpfh_installed']
    });
    
    return  radioInstallations ? radioInstallations.new_fpfh_installed : 1;
  } catch (error) {
    console.warn(`Could not fetch planning data for session ${sessionId}:`, error.message);
    return  1;
  }
};

// Helper function to create default empty FPFH data
const getDefaultFPFHData = (sessionId, fpfhIndex) => {
  return {
    id: null,
    session_id: sessionId,
    fpfh_index: fpfhIndex,
    fpfh_number: '',
    fpfh_installation_type: '',
    fpfh_location: '',
    fpfh_base_height: '',
    fpfh_tower_leg: '',
    fpfh_dc_power_source: '',
    dc_distribution_source: '',
    ethernet_cable_length: '',
    dc_power_cable_length: '',
    earth_bus_bar_exists: '',
    earth_cable_length: '',
    created_at: null,
    updated_at: null
  };
};

// Helper function to format FPFHs data with default empty strings
const formatFPFHData = (fpfh, sessionId, fpfhIndex) => {
  if (!fpfh) {
    return getDefaultFPFHData(sessionId, fpfhIndex);
  }

  const data = fpfh.toJSON();
  
  // Convert null values to empty strings for string fields
  const stringFields = [
    'fpfh_installation_type', 'fpfh_location', 'fpfh_tower_leg',
    'fpfh_dc_power_source', 'dc_distribution_source', 'earth_bus_bar_exists'
  ];
  
  const numericFields = [
    'fpfh_number', 'fpfh_base_height', 'ethernet_cable_length',
    'dc_power_cable_length', 'earth_cable_length'
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

  return data;
};

// GET /api/new-fpfh/:session_id
// Returns array based on new_fpfh_installed count with empty objects for missing ones
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get the planned FPFH count
    const newFPFHInstalled = await getNewFPFHInstalled(session_id);
     
    // Get existing FPFHs for this session
    const existingFPFHs = await NewFPFHs.findAll({
      where: { session_id },
      order: [['fpfh_index', 'ASC']]
    });

    // Create array with the expected number of FPFHs (filling missing ones with empty data)
    const formattedFPFHs = [];
    for (let i = 1; i <= newFPFHInstalled; i++) {
      const existingFPFH = existingFPFHs.find(fpfh => fpfh.fpfh_index === i);
      formattedFPFHs.push(formatFPFHData(existingFPFH, session_id, i));
    }

    res.json({
      session_id,
      new_fpfh_installed: newFPFHInstalled,
      fpfhs: formattedFPFHs,
      total_fpfhs: formattedFPFHs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-fpfh/:session_id/:fpfh_index
// Returns specific FPFH or default empty data if not exists
router.get('/:session_id/:fpfh_index', async (req, res) => {
  try {
    const { session_id, fpfh_index } = req.params;
    const index = parseInt(fpfh_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'fpfh_index must be a positive integer' });
    }

    const fpfh = await NewFPFHs.findOne({
      where: { 
        session_id,
        fpfh_index: index
      }
    });

    const formattedData = formatFPFHData(fpfh, session_id, index);
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/new-fpfh/:session_id/:fpfh_index
router.post('/:session_id/:fpfh_index', async (req, res) => {
  try {
    const { session_id, fpfh_index } = req.params;
    const fpfhData = req.body;
    const index = parseInt(fpfh_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'fpfh_index must be a positive integer' });
    }

    // Convert data for database compatibility
    const convertedData = convertDataForDB(fpfhData);

    // Check if FPFH already exists
    let fpfh = await NewFPFHs.findOne({
      where: { 
        session_id,
        fpfh_index: index
      }
    });

    if (fpfh) {
      // Update existing FPFH
      await fpfh.update(convertedData);
      res.json({
        message: `FPFH ${index} updated successfully`,
        data: formatFPFHData(fpfh, session_id, index)
      });
    } else {
      // Create new FPFH
      fpfh = await NewFPFHs.create({
        session_id,
        fpfh_index: index,
        ...convertedData
      });
      res.status(201).json({
        message: `FPFH ${index} created successfully`,
        data: formatFPFHData(fpfh, session_id, index)
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-fpfh/:session_id (bulk update/create FPFHs array)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const fpfhsArray = req.body.fpfhs || [];

    if (!Array.isArray(fpfhsArray)) {
      return res.status(400).json({ error: 'Request body must contain an fpfhs array' });
    }

    const results = [];

    // Process each FPFH in the array
    for (let i = 0; i < fpfhsArray.length; i++) {
      const fpfhData = fpfhsArray[i];
      const fpfhIndex = fpfhData.fpfh_index || (i + 1);

      try {
        // Convert data for database compatibility
        const convertedData = convertDataForDB(fpfhData);
       
        // Check if FPFH exists
        let fpfh = await NewFPFHs.findOne({
          where: { 
            session_id,
            fpfh_index: fpfhIndex
          }
        });

        if (fpfh) {
          // Update existing FPFH
          await fpfh.update(convertedData);
        } else {
          // Create new FPFH
          fpfh = await NewFPFHs.create({
            session_id,
            fpfh_index: fpfhIndex,
            ...convertedData
          });
        }

        results.push({
          fpfh_index: fpfhIndex,
          status: 'success',
          data: formatFPFHData(fpfh, session_id, fpfhIndex)
        });
      } catch (error) {
        results.push({
          fpfh_index: fpfhIndex,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      message: `Processed ${fpfhsArray.length} FPFHs for session ${session_id}`,
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-fpfh/:session_id/:fpfh_index
router.put('/:session_id/:fpfh_index', async (req, res) => {
  try {
    const { session_id, fpfh_index } = req.params;
    const fpfhData = req.body;
    const index = parseInt(fpfh_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'fpfh_index must be a positive integer' });
    }

    // Convert data for database compatibility
    const convertedData = convertDataForDB(fpfhData);

    let fpfh = await NewFPFHs.findOne({
      where: { 
        session_id,
        fpfh_index: index
      }
    });

    if (!fpfh) {
      // Create new FPFH if it doesn't exist
      fpfh = await NewFPFHs.create({
        session_id,
        fpfh_index: index,
        ...convertedData
      });
    } else {
      // Update existing FPFH (complete replacement)
      await fpfh.update(convertedData);
    }

    res.json({
      message: `FPFH ${index} updated successfully`,
      data: formatFPFHData(fpfh, session_id, index)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/new-fpfh/:session_id/:fpfh_index
router.patch('/:session_id/:fpfh_index', async (req, res) => {
  try {
    const { session_id, fpfh_index } = req.params;
    const updateData = req.body;
    const index = parseInt(fpfh_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'fpfh_index must be a positive integer' });
    }

    // Convert data for database compatibility
    const convertedData = convertDataForDB(updateData);

    let fpfh = await NewFPFHs.findOne({
      where: { 
        session_id,
        fpfh_index: index
      }
    });

    if (!fpfh) {
      // Create new FPFH with provided data
      fpfh = await NewFPFHs.create({
        session_id,
        fpfh_index: index,
        ...convertedData
      });
    } else {
      // Only update provided fields
      await fpfh.update(convertedData);
    }

    res.json({
      message: `FPFH ${index} partially updated successfully`,
      data: formatFPFHData(fpfh, session_id, index)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/new-fpfh/:session_id/:fpfh_index
router.delete('/:session_id/:fpfh_index', async (req, res) => {
  try {
    const { session_id, fpfh_index } = req.params;
    const index = parseInt(fpfh_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'fpfh_index must be a positive integer' });
    }

    const fpfh = await NewFPFHs.findOne({
      where: { 
        session_id,
        fpfh_index: index
      }
    });

    if (!fpfh) {
      return res.status(404).json({ 
        error: `FPFH ${index} not found for session ${session_id}` 
      });
    }

    await fpfh.destroy();

    res.json({
      message: `FPFH ${index} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/new-fpfh/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const deletedCount = await NewFPFHs.destroy({
      where: { session_id }
    });

    res.json({
      message: `All FPFHs for session ${session_id} deleted successfully`,
      deleted_count: deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-fpfh/:session_id/config
// Returns configuration data including planning information
router.get('/:session_id/config', async (req, res) => {
  try {
    const { session_id } = req.params;

    const [radioInstallations, fpfhsCount] = await Promise.all([
      NewRadioInstallations.findOne({
        where: { session_id },
        attributes: ['new_fpfh_installed']
      }),
      NewFPFHs.count({ where: { session_id } })
    ]);

    res.json({
      session_id,
      new_fpfh_installed: radioInstallations ? radioInstallations.new_fpfh_installed : 1,
      current_fpfhs_count: fpfhsCount,
      has_radio_installations_data: !!radioInstallations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 