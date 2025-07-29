const express = require('express');
const router = express.Router();
const path = require('path');
const NewAntennas = require('../models/NewAntennas');
const NewAntennasImages = require('../models/NewAntennasImages');
const NewRadioInstallations = require('../models/NewRadioInstallations');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

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
const getDefaultAntennaData = (sessionId, antennaIndex) => ({
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
  antennaVendor:'',
  antennaVendorOther:'',
  antennaHeight:'',
  antennaWeight:'',
  antennaDiameter:'',
  created_at: null,
  updated_at: null
});

// Helper function to get images for an antenna
const getAntennaImages = async (sessionId, antennaIndex) => {
  console.log(`Getting images for session ${sessionId}, antenna ${antennaIndex}`);
  const images = await NewAntennasImages.findAll({
    where: { session_id: sessionId, antenna_index: antennaIndex }
  });
  console.log(`Found ${images.length} images in database:`, images.map(img => ({ id: img.id, category: img.image_category, path: img.image_path })));
  
  const mappedImages = images.map(img => ({
    id: img.id,
    category: img.image_category,
    path: img.image_path
  }));
  
  console.log(`Mapped images:`, mappedImages);
  return mappedImages;
};

// Format antenna data with fallback defaults and images
const formatAntennaData = async (antenna, sessionId, antennaIndex) => {
  const baseData = !antenna ? getDefaultAntennaData(sessionId, antennaIndex) : antenna.toJSON();

  const stringFields = [
    'sector_number', 'new_or_swap', 'tower_leg_location', 'tower_leg_section',
    'side_arm_type', 'earth_bus_bar_exists','antennaVendor','antennaVendorOther'
  ];

  const numericFields = [
    'azimuth_angle_shift', 'base_height_from_tower', 'angular_l1_dimension',
    'angular_l2_dimension', 'tubular_cross_section', 'side_arm_length',
    'side_arm_cross_section', 'side_arm_offset', 'earth_cable_length',
    'antennaHeight','antennaWeight','antennaDiameter',
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

  baseData.images = await getAntennaImages(sessionId, antennaIndex);

  return baseData;
};

// === ROUTES ===

// GET all antennas for a session
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const newAntennasPlanned = await getNewAntennasPlanned(session_id);

    const existingAntennas = await NewAntennas.findAll({
      where: { session_id },
      order: [['antenna_index', 'ASC']]
    });

    console.log(`Found ${existingAntennas.length} antennas for session ${session_id}`);

    const formattedAntennas = await Promise.all(
      existingAntennas.map(async (antenna) => {
        const formatted = await formatAntennaData(antenna, session_id, antenna.antenna_index);
        console.log(`Antenna ${antenna.antenna_index} has ${formatted.images.length} images:`, formatted.images);
        return formatted;
      })
    );

    const response = {
      session_id,
      new_antennas_planned: newAntennasPlanned,
      antennas: formattedAntennas,
      total_antennas: formattedAntennas.length
    };

    console.log('Final response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error in GET route:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single antenna by index
router.get('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    const antenna = await NewAntennas.findOne({
      where: { session_id, antenna_index: index }
    });

    const formattedData = await formatAntennaData(antenna, session_id, index);
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create or update antenna by index
router.post('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const antennaData = req.body;
    const index = parseInt(antenna_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'antenna_index must be a positive integer' });
    }

    let antenna = await NewAntennas.findOne({
      where: { session_id, antenna_index: index }
    });

    if (antenna) {
      await antenna.update(antennaData);
    } else {
      antenna = await NewAntennas.create({
        session_id,
        antenna_index: index,
        ...antennaData
      });
    }

    res.status(201).json({
      message: `Antenna ${index} created or updated successfully`,
      data: await formatAntennaData(antenna, session_id, index)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT bulk update/create
router.put('/:session_id', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id } = req.params;
    let updateData = req.body;

    if (req.files && req.files.length > 0 && typeof updateData.data === 'string') {
      try {
        updateData = JSON.parse(updateData.data);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format in data field' });
      }
    }

    const antennasArray = updateData.antennas || [];

    if (!Array.isArray(antennasArray)) {
      return res.status(400).json({ error: 'Request body must contain an antennas array' });
    }

    const results = [];

    for (let i = 0; i < antennasArray.length; i++) {
      const antennaData = antennasArray[i];
      const antennaIndex = antennaData.antenna_index || (i + 1);

      try {
        let antenna = await NewAntennas.findOne({
          where: { session_id, antenna_index: antennaIndex }
        });

        if (antenna) {
          await antenna.update(antennaData);
        } else {
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

    const imageResults = [];
    let hasImageUploadFailures = false;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          let antenna_index = 1; // Default to 1 if no index found
          let category = field;

          // Try to extract antenna index and category
          const match = field.match(/new_antenna_(\d+)_(.+)/);
          if (match) {
            antenna_index = parseInt(match[1], 10);
            category = match[2]; // This will be the category part
          }

          const relativePath = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');

          const image = await NewAntennasImages.create({
            session_id,
            antenna_index,
            image_category: category,
            image_path: relativePath
          });

          imageResults.push({ field, success: true, data: image });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field: file.fieldname, success: false, error: err.message });
        }
      }
    }

    const response = {
      message: `Processed ${antennasArray.length} antennas for session ${session_id}`,
      results
    };

    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: imageResults.filter(r => r.success).length,
        failed: imageResults.filter(r => !r.success).length,
        details: imageResults
      };
    }

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT single antenna update
router.put('/:session_id/:antenna_index', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    let antennaData = req.body;
    const index = parseInt(antenna_index);

    if (req.files && req.files.length > 0 && typeof antennaData.data === 'string') {
      try {
        antennaData = JSON.parse(antennaData.data);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format in data field' });
      }
    }

    let antenna = await NewAntennas.findOne({
      where: { session_id, antenna_index: index }
    });

    if (!antenna) {
      antenna = await NewAntennas.create({
        session_id,
        antenna_index: index,
        ...antennaData
      });
    } else {
      await antenna.update(antennaData);
    }

    const imageResults = [];
    let hasImageUploadFailures = false;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          let category = field;

          // Try to extract category from field name
          const match = field.match(/new_antenna_(\d+)_(.+)/);
          if (match) {
            category = match[2]; // This will be the category part
          }

          const image = await NewAntennasImages.create({
            session_id,
            antenna_index: index,
            image_category: category,
            image_path: file.path
          });

          imageResults.push({ field: file.fieldname, success: true, data: image });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field: file.fieldname, success: false, error: err.message });
        }
      }
    }

    const response = {
      message: `Antenna ${index} updated successfully`,
      data: await formatAntennaData(antenna, session_id, index)
    };

    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: imageResults.filter(r => r.success).length,
        failed: imageResults.filter(r => !r.success).length,
        details: imageResults
      };
    }

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH partial update
router.patch('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const updateData = req.body;
    const index = parseInt(antenna_index);

    let antenna = await NewAntennas.findOne({
      where: { session_id, antenna_index: index }
    });

    if (!antenna) {
      antenna = await NewAntennas.create({
        session_id,
        antenna_index: index,
        ...updateData
      });
    } else {
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

// DELETE antenna by index
router.delete('/:session_id/:antenna_index', async (req, res) => {
  try {
    const { session_id, antenna_index } = req.params;
    const index = parseInt(antenna_index);

    const antenna = await NewAntennas.findOne({
      where: { session_id, antenna_index: index }
    });

    if (!antenna) {
      return res.status(404).json({ error: `Antenna ${index} not found for session ${session_id}` });
    }

    await antenna.destroy();

    res.json({ message: `Antenna ${index} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all antennas for session
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const deletedCount = await NewAntennas.destroy({ where: { session_id } });
    res.json({ message: `All antennas for session ${session_id} deleted`, deleted_count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET config data for a session
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
