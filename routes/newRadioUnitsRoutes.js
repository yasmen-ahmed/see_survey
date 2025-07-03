const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const NewRadioUnits = require('../models/NewRadioUnits');
const NewRadioUnitsImages = require('../models/NewRadioUnitsImages');
const NewRadioInstallations = require('../models/NewRadioInstallations');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

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

// Helper function to get images for a Radio Unit
const getRadioUnitImages = async (sessionId, radioUnitIndex) => {
  const images = await NewRadioUnitsImages.findAll({
    where: { session_id: sessionId, radio_unit_index: radioUnitIndex }
  });
  
  return images.map(img => ({
    id: img.id,
    category: img.image_category,
    file_url: img.image_path  // Return the relative path directly
  }));
};

// Update formatRadioUnitData to include images
const formatRadioUnitData = async (radioUnit, sessionId, radioUnitIndex) => {
  const baseData = !radioUnit ? getDefaultRadioUnitData(sessionId, radioUnitIndex) : radioUnit.toJSON();
  
  // Format existing fields as before
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
    if (baseData[field] === null || baseData[field] === undefined) {
      baseData[field] = '';
    }
  });

  numericFields.forEach(field => {
    if (baseData[field] === null || baseData[field] === undefined) {
      baseData[field] = '';
    }
  });

  if (!Array.isArray(baseData.connected_antenna_technology)) {
    baseData.connected_antenna_technology = [];
  }

  // Add images
  baseData.images = await getRadioUnitImages(sessionId, radioUnitIndex);
  
  return baseData;
};

// Update GET routes to include images
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [newRadioUnitsPlanned, existingRadioUnits] = await Promise.all([
      getNewRadioUnitsPlanned(session_id),
      NewRadioUnits.findAll({
        where: { session_id },
        order: [['radio_unit_index', 'ASC']]
      })
    ]);

    const formattedRadioUnits = await Promise.all(
      existingRadioUnits.map(unit => 
        formatRadioUnitData(unit, session_id, unit.radio_unit_index)
      )
    );

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

// Update single radio unit GET route
router.get('/:session_id/:radio_unit_index', async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    const radioUnit = await NewRadioUnits.findOne({
      where: { session_id, radio_unit_index: index }
    });

    const formattedData = await formatRadioUnitData(radioUnit, session_id, index);
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
        data: await formatRadioUnitData(radioUnit, session_id, index)
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
        data: await formatRadioUnitData(radioUnit, session_id, index)
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-units/:session_id
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

    const radioUnitsArray = updateData.radio_units || [];

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
          data: await formatRadioUnitData(radioUnit, session_id, radioUnitIndex)
        });
      } catch (error) {
        results.push({
          radio_unit_index: radioUnitIndex,
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
          let radio_unit_index = 1; // Default to 1 if no index found
          let category = field;

          // Try to extract radio unit index if present
          const match = field.match(/new_radio_(\d+)_/);
          if (match) {
            radio_unit_index = parseInt(match[1], 10);
            category = field.replace(`new_radio_${radio_unit_index}_`, '');
          }

          // Check for existing image with the same category and radio unit index
          const existingImage = await NewRadioUnitsImages.findOne({
            where: {
              session_id,
              radio_unit_index,
              image_category: category
            }
          });

          // If an image with the same category exists, delete it
          if (existingImage) {
            try {
              // Delete the old file from disk
              const oldImagePath = path.join(__dirname, '..', existingImage.image_path);
              if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
              }
              // Delete the record from database
              await existingImage.destroy();
              console.log(`Deleted existing image: ${existingImage.image_path}`);
            } catch (deleteError) {
              console.error('Error deleting existing image:', deleteError);
              // Continue with the upload even if delete fails
            }
          }

          // Create unique filename that includes radio unit index and category
          const fileExt = path.extname(file.originalname);
          const uniqueFilename = `new_radio_${radio_unit_index}_${category}_${Date.now()}${fileExt}`;
          const relativePath = `uploads/new_radio_units/${uniqueFilename}`;
          const fullPath = path.join(__dirname, '..', relativePath);

          // Ensure directory exists
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          // Save the new file
          fs.copyFileSync(file.path, fullPath);
          fs.unlinkSync(file.path); // Clean up temp file

          // Create new image record
          const image = await NewRadioUnitsImages.create({
            session_id,
            radio_unit_index,
            image_category: category,
            image_path: relativePath
          });

          imageResults.push({
            field,
            radio_unit_index,
            category,
            success: true,
            data: image,
            replaced: !!existingImage // Indicate if this was a replacement
          });

        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({
            field: file.fieldname,
            success: false,
            error: err.message
          });
        }
      }
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;
    const replacedCount = imageResults.filter(r => r.success && r.replaced).length;

    const response = {
      message: `Processed ${radioUnitsArray.length} radio units for session ${session_id}`,
      results
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        replaced: replacedCount,
        details: imageResults
      };
      
      let imageMessage = ` and ${successCount} image(s) processed`;
      if (replacedCount > 0) {
        imageMessage += ` (${replacedCount} replaced)`;
      }
      if (failCount > 0) {
        imageMessage += ` but ${failCount} image upload(s) failed`;
      }
      response.message += imageMessage;
    }

    res.json(response);
  } catch (error) {
    console.error('Error in radio units update:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-units/:session_id/:radio_unit_index
router.put('/:session_id/:radio_unit_index', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id, radio_unit_index } = req.params;
    let radioUnitData = req.body;
    const index = parseInt(radio_unit_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'radio_unit_index must be a positive integer' });
    }

    // Handle multipart/form-data format (when uploading files)
    if (req.files && req.files.length > 0) {
      // Parse data from form data if it exists
      if (radioUnitData.data && typeof radioUnitData.data === 'string') {
        try {
          radioUnitData = JSON.parse(radioUnitData.data);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid JSON format in data field'
          });
        }
      }
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

    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          
          // Create image record
          const image = await NewRadioUnitsImages.create({
            session_id,
            radio_unit_index: index,
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
      message: `Radio unit ${index} updated successfully`,
      data: await formatRadioUnitData(radioUnit, session_id, index)
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
      
      if (hasImageUploadFailures) {
        response.message = `Radio unit ${index} updated but ${failCount} image upload(s) failed`;
      } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.json(response);
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
      data: await formatRadioUnitData(radioUnit, session_id, index)
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

