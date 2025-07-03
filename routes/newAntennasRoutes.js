const express = require('express');
const router = express.Router();
const path = require('path');
const NewAntennas = require('../models/NewAntennas');
const NewAntennasImages = require('../models/NewAntennasImages');
const NewRadioInstallations = require('../models/NewRadioInstallations');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

// Validation helper for new antennas data
const validateNewAntennaData = (data) => {
  const validSectors = ['1', '2', '3', '4', '5', '6'];
  const validNewOrSwap = ['New', 'Swap'];
  const validTowerLegs = ['A', 'B', 'C', 'D'];
  const validTowerSections = ['Angular', 'Tubular'];
  const validSideArmTypes = [
    'Use existing empty side arm', 
    'Use swapped antenna side arm', 
    'New side arm need to be supplied'
  ];
  const validYesNo = ['Yes', 'No'];
  const validTechnologies = ['2G', '3G', '4G', '5G'];

  // Validate enum fields
  if (data.sector_number && !validSectors.includes(data.sector_number)) {
    throw new Error(`Invalid sector_number: ${data.sector_number}`);
  }
  
  if (data.new_or_swap && !validNewOrSwap.includes(data.new_or_swap)) {
    throw new Error(`Invalid new_or_swap: ${data.new_or_swap}`);
  }
  
  if (data.tower_leg_location && !validTowerLegs.includes(data.tower_leg_location)) {
    throw new Error(`Invalid tower_leg_location: ${data.tower_leg_location}`);
  }
  
  if (data.tower_leg_section && !validTowerSections.includes(data.tower_leg_section)) {
    throw new Error(`Invalid tower_leg_section: ${data.tower_leg_section}`);
  }
  
  if (data.side_arm_type && !validSideArmTypes.includes(data.side_arm_type)) {
    throw new Error(`Invalid side_arm_type: ${data.side_arm_type}`);
  }
  
  if (data.earth_bus_bar_exists && !validYesNo.includes(data.earth_bus_bar_exists)) {
    throw new Error(`Invalid earth_bus_bar_exists: ${data.earth_bus_bar_exists}`);
  }

  // Validate antenna technology array
  if (data.antenna_technology && Array.isArray(data.antenna_technology)) {
    data.antenna_technology.forEach(tech => {
      if (!validTechnologies.includes(tech)) {
        throw new Error(`Invalid antenna technology: ${tech}`);
      }
    });
  }

  // Validate numeric fields
  const numericFields = [
    'azimuth_angle_shift', 'base_height_from_tower', 'angular_l1_dimension',
    'angular_l2_dimension', 'tubular_cross_section', 'side_arm_length',
    'side_arm_cross_section', 'side_arm_offset', 'earth_cable_length'
  ];
  
  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      if (isNaN(data[field]) || data[field] < 0) {
        throw new Error(`${field} must be a positive number`);
      }
    }
  });

  // Validate antenna_index
  if (data.antenna_index !== undefined) {
    if (!Number.isInteger(data.antenna_index) || data.antenna_index < 1) {
      throw new Error('antenna_index must be a positive integer');
    }
  }
};

// Helper function to get new_antennas_planned from NewRadioInstallations
const getNewAntennasPlanned = async (sessionId) => {
  try {
    const radioInstallations = await NewRadioInstallations.findOne({
      where: { session_id: sessionId },
      attributes: ['new_antennas_planned']
    });
    
    return radioInstallations ? radioInstallations.new_antennas_planned : 1;
  } catch (error) {
    console.warn(`Could not fetch new_antennas_planned for session ${sessionId}:`, error.message);
    return 1;
  }
};

// Helper function to create default empty antenna data
const getDefaultAntennaData = (sessionId, antennaIndex) => {
  return {
    id: null,
    session_id: sessionId,
    antenna_index: antennaIndex,
    sector_number: '',
    new_or_swap: '',
    antenna_technology: [],
    azimuth_angle_shift: '',
    base_height_from_tower: '',
    tower_leg_location: '',
    tower_leg_section: '',
    angular_l1_dimension: '',
    angular_l2_dimension: '',
    tubular_cross_section: '',
    side_arm_type: '',
    side_arm_length: '',
    side_arm_cross_section: '',
    side_arm_offset: '',
    earth_bus_bar_exists: '',
    earth_cable_length: '',
    created_at: null,
    updated_at: null
  };
};

// Helper function to get images for an antenna
const getAntennaImages = async (sessionId, antennaIndex) => {
  const images = await NewAntennasImages.findAll({
    where: { session_id: sessionId, antenna_index: antennaIndex }
  });
  
  return images.map(img => ({
    id: img.id,
    category: img.image_category,
    path: img.image_path
  }));
};

// Update formatAntennaData to include images
const formatAntennaData = async (antenna, sessionId, antennaIndex) => {
  const baseData = !antenna ? getDefaultAntennaData(sessionId, antennaIndex) : antenna.toJSON();
  
  // Format existing fields as before
  const stringFields = [
    'sector_number', 'new_or_swap', 'tower_leg_location', 'tower_leg_section',
    'side_arm_type', 'earth_bus_bar_exists'
  ];
  
  const numericFields = [
    'azimuth_angle_shift', 'base_height_from_tower', 'angular_l1_dimension',
    'angular_l2_dimension', 'tubular_cross_section', 'side_arm_length',
    'side_arm_cross_section', 'side_arm_offset', 'earth_cable_length'
  ];

  stringFields.forEach(field => {
    if (baseData[field] === null || baseData[field] === undefined) {
      baseData[field] = '';
    }
  });

  numericFields.forEach(field => {
    if (baseData[field] === null || baseData[field] === undefined) {
      baseData[field] = '';
    }
  });

  if (!Array.isArray(baseData.antenna_technology)) {
    baseData.antenna_technology = [];
  }

  // Add images
  baseData.images = await getAntennaImages(sessionId, antennaIndex);
  
  return baseData;
};

// GET /api/new-antennas/:session_id
// Returns only antennas that exist for this session
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get the planned antenna count
    const newAntennasPlanned = await getNewAntennasPlanned(session_id);
    
    // Get existing antennas for this session
    const existingAntennas = await NewAntennas.findAll({
      where: { session_id },
      order: [['antenna_index', 'ASC']]
    });

    // Format existing antennas with default values and include images
    const formattedAntennas = await Promise.all(
      existingAntennas.map(antenna => 
        formatAntennaData(antenna, session_id, antenna.antenna_index)
      )
    );

    res.json({
      session_id,
      new_antennas_planned: newAntennasPlanned,
      antennas: formattedAntennas,
      total_antennas: formattedAntennas.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-antennas/:session_id/:antenna_index
// Returns specific antenna or default empty data if not exists
router.get('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    const antenna = await NewAntennas.findOne({
      where: { 
        session_id,
        antenna_index: index
      }
    });

    const formattedData = await formatAntennaData(antenna, session_id, index);
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/new-antennas/:session_id/:antenna_index
router.post('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const antennaData = req.body;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    // Validate antenna data
    try {
      validateNewAntennaData(antennaData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if antenna already exists
    let antenna = await NewAntennas.findOne({
      where: { 
        session_id,
        antenna_index: index
      }
    });

    if (antenna) {
      // Update existing antenna
      await antenna.update(antennaData);
      res.json({
        message: `Antenna ${index} updated successfully`,
        data: await formatAntennaData(antenna, session_id, index)
      });
    } else {
      // Create new antenna
      antenna = await NewAntennas.create({
        session_id,
        antenna_index: index,
        ...antennaData
      });
      res.status(201).json({
        message: `Antenna ${index} created successfully`,
        data: await formatAntennaData(antenna, session_id, index)
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-antennas/:session_id (bulk update/create antennas array)
router.put('/:session_id', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id } = req.params;
    let updateData = req.body;
    
    // Handle multipart/form-data format (when uploading files)
    if (req.files && req.files.length > 0) {
      // Parse data from form data if it exists
      if (updateData.data && typeof updateData.data === 'string') {
        try {
          updateData = JSON.parse(updateData.data);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid JSON format in data field'
          });
        }
      }
    }

    const antennasArray = updateData.antennas || [];

    if (!Array.isArray(antennasArray)) {
      return res.status(400).json({ error: 'Request body must contain an antennas array' });
    }

    const results = [];

    // Process each antenna in the array
    for (let i = 0; i < antennasArray.length; i++) {
      const antennaData = antennasArray[i];
      const antennaIndex = antennaData.antenna_index || (i + 1);

      try {
        // Validate antenna data
        validateNewAntennaData(antennaData);

        // Check if antenna exists
        let antenna = await NewAntennas.findOne({
          where: { 
            session_id,
            antenna_index: antennaIndex
          }
        });

        if (antenna) {
          // Update existing antenna
          await antenna.update(antennaData);
        } else {
          // Create new antenna
          antenna = await NewAntennas.create({
            session_id,
            antenna_index: antennaIndex,
            ...antennaData
          });
        }

        results.push({
          antenna_index: antennaIndex,
          status: 'success',
          data: await formatAntennaData(antenna, session_id, antennaIndex)
        });
      } catch (error) {
        results.push({
          antenna_index: antennaIndex,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          let antenna_index;
          
          // Handle antenna image field naming: new_antenna_X_* (with optional spaces)
          console.log('Processing field:', field); // Debug log
          
          // Remove any spaces and normalize the field name
          const normalizedField = field.replace(/\s+/g, '');
          console.log('Normalized field:', normalizedField); // Debug log
          
          const antennaMatch = normalizedField.match(/new_antenna_(\d+)_/);
          console.log('Regex match result:', antennaMatch); // Debug log
          
          if (antennaMatch) {
            antenna_index = parseInt(antennaMatch[1], 10);
            console.log('Extracted antenna_index:', antenna_index); // Debug log
          } else {
            console.log('Field did not match expected pattern'); // Debug log
            throw new Error(`Invalid field name format: ${field}. Expected new_antenna_X_* format (received: ${normalizedField})`);
          }
          
          // Get the planned antenna count
          const newAntennasPlanned = await getNewAntennasPlanned(session_id);
          
          if (!antenna_index || antenna_index > newAntennasPlanned) {
            throw new Error(`Invalid antenna index ${antenna_index} in field ${field}. Must be between 1 and ${newAntennasPlanned}`);
          }

          // Create image record with relative path
          const relativePath = path.relative(
            path.join(__dirname, '..'),
            file.path
          ).replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes
          
          const image = await NewAntennasImages.create({
            session_id,
            antenna_index,
            image_category: field,
            image_path: relativePath
          });
          
          imageResults.push({ field, success: true, data: image });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field: file.fieldname, success: false, error: err.message });
        }
      }
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    const response = {
      message: `Processed ${antennasArray.length} antennas for session ${session_id}`,
      results
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
      
      if (hasImageUploadFailures) {
        response.message += ` but ${failCount} image upload(s) failed`;
      } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-antennas/:session_id/:antenna_index
router.put('/:session_id/:antenna_index', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    let antennaData = req.body;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    // Handle multipart/form-data format (when uploading files)
    if (req.files && req.files.length > 0) {
      // Parse data from form data if it exists
      if (antennaData.data && typeof antennaData.data === 'string') {
        try {
          antennaData = JSON.parse(antennaData.data);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid JSON format in data field'
          });
        }
      }
    }

    // Validate antenna data
    try {
      validateNewAntennaData(antennaData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    let antenna = await NewAntennas.findOne({
      where: { 
        session_id,
        antenna_index: index
      }
    });

    if (!antenna) {
      // Create new antenna if it doesn't exist
      antenna = await NewAntennas.create({
        session_id,
        antenna_index: index,
        ...antennaData
      });
    } else {
      // Update existing antenna (complete replacement)
      await antenna.update(antennaData);
    }

    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          
          // For individual antenna route, we accept any field name and use the antenna_index from the URL
          // Create image record
          const image = await NewAntennasImages.create({
            session_id,
            antenna_index: index,
            image_category: field,
            image_path: file.path || file.filename
          });
          
          imageResults.push({ field, success: true, data: image });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field: file.fieldname, success: false, error: err.message });
        }
      }
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    const response = {
      message: `Antenna ${index} updated successfully`,
      data: await formatAntennaData(antenna, session_id, index)
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
      
      if (hasImageUploadFailures) {
        response.message = `Antenna ${index} updated but ${failCount} image upload(s) failed`;
      } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/new-antennas/:session_id/:antenna_index
router.patch('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const updateData = req.body;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    // Validate update data
    try {
      validateNewAntennaData(updateData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    let antenna = await NewAntennas.findOne({
      where: { 
        session_id,
        antenna_index: index
      }
    });

    if (!antenna) {
      // Create new antenna with provided data
      antenna = await NewAntennas.create({
        session_id,
        antenna_index: index,
        ...updateData
      });
    } else {
      // Only update provided fields
      await antenna.update(updateData);
    }

    res.json({
      message: `Antenna ${index} partially updated successfully`,
      data: await formatAntennaData(antenna, session_id, index)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/new-antennas/:session_id/:antenna_index
router.delete('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    const antenna = await NewAntennas.findOne({
      where: { 
        session_id,
        antenna_index: index
      }
    });

    if (!antenna) {
      return res.status(404).json({ 
        error: `Antenna ${index} not found for session ${session_id}` 
      });
    }

    await antenna.destroy();

    res.json({
      message: `Antenna ${index} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/new-antennas/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const deletedCount = await NewAntennas.destroy({
      where: { session_id }
    });

    res.json({
      message: `All antennas for session ${session_id} deleted successfully`,
      deleted_count: deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-antennas/:session_id/config
// Returns configuration data including new_antennas_planned
router.get('/:session_id/config', async (req, res) => {
  try {
    const { session_id } = req.params;

    const [radioInstallations, antennasCount] = await Promise.all([
      NewRadioInstallations.findOne({
        where: { session_id },
        attributes: ['new_antennas_planned', 'existing_antennas_swapped']
      }),
      NewAntennas.count({ where: { session_id } })
    ]);

    res.json({
      session_id,
      new_antennas_planned: radioInstallations ? radioInstallations.new_antennas_planned : 1,
      existing_antennas_swapped: radioInstallations ? radioInstallations.existing_antennas_swapped : 1,
      current_antennas_count: antennasCount,
      has_radio_installations_data: !!radioInstallations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 