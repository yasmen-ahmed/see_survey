const express = require('express');
const router = express.Router();
const NewFPFHs = require('../models/NewFPFHs');
const NewRadioInstallations = require('../models/NewRadioInstallations');

// Validation helper for new FPFHs data
const validateNewFPFHData = (data) => {
  const validInstallationTypes = ['Stacked with other Nokia modules', 'Standalone', 'Other'];
  const validLocations = ['On ground', 'On tower'];
  const validTowerLegs = ['A', 'B', 'C', 'D'];
  const validDcPowerSources = ['from new DC rectifier cabinet', 'from the existing rectifier cabinet', 'Existing external DC PDU #1', 'Existing external DC PDU #2', 'Existing external DC PDU #n'];
  const validDcDistributionSources = ['BLVD', 'LLVD', 'PDU'];
  const validYesNo = ['Yes', 'No'];

  // Validate enum fields
  if (data.fpfh_installation_type && !validInstallationTypes.includes(data.fpfh_installation_type)) {
    throw new Error(`Invalid fpfh_installation_type: ${data.fpfh_installation_type}`);
  }
  
  if (data.fpfh_location && !validLocations.includes(data.fpfh_location)) {
    throw new Error(`Invalid fpfh_location: ${data.fpfh_location}`);
  }
  
  if (data.fpfh_tower_leg && !validTowerLegs.includes(data.fpfh_tower_leg)) {
    throw new Error(`Invalid fpfh_tower_leg: ${data.fpfh_tower_leg}`);
  }
  
  if (data.fpfh_dc_power_source && !validDcPowerSources.includes(data.fpfh_dc_power_source)) {
    throw new Error(`Invalid fpfh_dc_power_source: ${data.fpfh_dc_power_source}`);
  }
  
  if (data.dc_distribution_source && !validDcDistributionSources.includes(data.dc_distribution_source)) {
    throw new Error(`Invalid dc_distribution_source: ${data.dc_distribution_source}`);
  }
  
  if (data.earth_bus_bar_exists && !validYesNo.includes(data.earth_bus_bar_exists)) {
    throw new Error(`Invalid earth_bus_bar_exists: ${data.earth_bus_bar_exists}`);
  }

  // Validate numeric fields
  const numericFields = [
    'fpfh_number', 'fpfh_base_height', 'ethernet_cable_length',
    'dc_power_cable_length', 'earth_cable_length'
  ];
  
  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      if (isNaN(data[field]) || data[field] < 0) {
        throw new Error(`${field} must be a positive number`);
      }
    }
  });

  // Validate fpfh_index
  if (data.fpfh_index !== undefined) {
    if (!Number.isInteger(data.fpfh_index) || data.fpfh_index < 1) {
      throw new Error('fpfh_index must be a positive integer');
    }
  }
};

// Helper function to get planning data from NewRadioInstallations
const getPlanningData = async (sessionId) => {
  try {
    const radioInstallations = await NewRadioInstallations.findOne({
      where: { session_id: sessionId },
      attributes: ['new_fpfh_installed']
    });
    
    return {
      new_fpfh_installed: radioInstallations ? radioInstallations.new_fpfh_installed : 1
    };
  } catch (error) {
    console.warn(`Could not fetch planning data for session ${sessionId}:`, error.message);
    return {
      new_fpfh_installed: 1
    };
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
// Returns only FPFHs that exist for this session
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get planning data and existing FPFHs data in parallel
    const [planningData, existingFPFHs] = await Promise.all([
      getPlanningData(session_id),
      NewFPFHs.findAll({
        where: { session_id },
        order: [['fpfh_index', 'ASC']]
      })
    ]);

    // Format existing FPFHs with default values
    const formattedFPFHs = existingFPFHs.map(fpfh => 
      formatFPFHData(fpfh, session_id, fpfh.fpfh_index)
    );

    res.json({
      session_id,
      ...planningData,
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

    // Validate FPFH data
    try {
      validateNewFPFHData(fpfhData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if FPFH already exists
    let fpfh = await NewFPFHs.findOne({
      where: { 
        session_id,
        fpfh_index: index
      }
    });

    if (fpfh) {
      // Update existing FPFH
      await fpfh.update(fpfhData);
      res.json({
        message: `FPFH ${index} updated successfully`,
        data: formatFPFHData(fpfh, session_id, index)
      });
    } else {
      // Create new FPFH
      fpfh = await NewFPFHs.create({
        session_id,
        fpfh_index: index,
        ...fpfhData
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
        // Validate FPFH data
        validateNewFPFHData(fpfhData);

        // Check if FPFH exists
        let fpfh = await NewFPFHs.findOne({
          where: { 
            session_id,
            fpfh_index: fpfhIndex
          }
        });

        if (fpfh) {
          // Update existing FPFH
          await fpfh.update(fpfhData);
        } else {
          // Create new FPFH
          fpfh = await NewFPFHs.create({
            session_id,
            fpfh_index: fpfhIndex,
            ...fpfhData
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

    // Get planning data for response
    const planningData = await getPlanningData(session_id);

    res.json({
      message: `Processed ${fpfhsArray.length} FPFHs for session ${session_id}`,
      session_id,
      ...planningData,
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

    // Validate FPFH data
    try {
      validateNewFPFHData(fpfhData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

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
        ...fpfhData
      });
    } else {
      // Update existing FPFH (complete replacement)
      await fpfh.update(fpfhData);
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

    // Validate update data
    try {
      validateNewFPFHData(updateData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

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
        ...updateData
      });
    } else {
      // Only update provided fields
      await fpfh.update(updateData);
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
module.exports = router; 