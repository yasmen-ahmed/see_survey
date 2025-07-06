const express = require('express');
const router = express.Router();
const path = require('path');
const NewFPFHs = require('../models/NewFPFHs');
const NewFPFHsImages = require('../models/NewFPFHsImages');
const NewRadioInstallations = require('../models/NewRadioInstallations');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const fs = require('fs');

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

// Helper function to get images for an FPFH
const getFPFHImages = async (sessionId, fpfhIndex) => {
  const images = await NewFPFHsImages.findAll({
    where: { session_id: sessionId, fpfh_index: fpfhIndex }
  });
  
  return images.map(img => ({
    id: img.id,
    category: img.image_category,
    file_url: img.image_path  // Return the relative path directly
  }));
};

// Update formatFPFHData to include images
const formatFPFHData = async (fpfh, sessionId, fpfhIndex) => {
  const baseData = !fpfh ? getDefaultFPFHData(sessionId, fpfhIndex) : fpfh.toJSON();
  
  // Format existing fields as before
  const stringFields = [
    'fpfh_installation_type', 'fpfh_location', 'fpfh_tower_leg',
    'fpfh_dc_power_source', 'dc_distribution_source', 'earth_bus_bar_exists'
  ];
  
  const numericFields = [
    'fpfh_number', 'fpfh_base_height', 'ethernet_cable_length',
    'dc_power_cable_length', 'earth_cable_length'
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

  // Add images
  baseData.images = await getFPFHImages(sessionId, fpfhIndex);
  
  return baseData;
};

// GET /api/new-fpfh/:session_id
// Returns array based on new_fpfh_installed count with empty objects for missing ones
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [newFPFHInstalled, existingFPFHs] = await Promise.all([
      getNewFPFHInstalled(session_id),
      NewFPFHs.findAll({
      where: { session_id },
      order: [['fpfh_index', 'ASC']]
      })
    ]);

    const formattedFPFHs = await Promise.all(
      existingFPFHs.map(fpfh => 
        formatFPFHData(fpfh, session_id, fpfh.fpfh_index)
      )
    );

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
      where: { session_id, fpfh_index: index }
    });

    const formattedData = await formatFPFHData(fpfh, session_id, index);
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
        data: await formatFPFHData(fpfh, session_id, index)
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
        data: await formatFPFHData(fpfh, session_id, index)
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-fpfh/:session_id (bulk update/create FPFHs array)
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

    const fpfhsArray = updateData.fpfhs || [];

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
          data: await formatFPFHData(fpfh, session_id, fpfhIndex)
        });
      } catch (error) {
        results.push({
          fpfh_index: fpfhIndex,
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
          let fpfh_index;
          
          // Handle FPFH image field naming
          console.log('Processing field:', field);
          
          // Remove any spaces and normalize the field name
          const normalizedField = field.replace(/\s+/g, '');
          console.log('Normalized field:', normalizedField);
          
          const fpfhMatch = normalizedField.match(/new_fpfh_(\d+)_/);
          console.log('Regex match result:', fpfhMatch);
          
          if (fpfhMatch) {
            fpfh_index = parseInt(fpfhMatch[1], 10);
            console.log('Extracted fpfh_index:', fpfh_index);
          } else {
            console.log('Field did not match expected pattern');
            throw new Error(`Invalid field name format: ${field}. Expected new_fpfh_X_* format (received: ${normalizedField})`);
          }
          
          // Get the planned FPFH count
          const newFPFHInstalled = await getNewFPFHInstalled(session_id);
          
          if (!fpfh_index || fpfh_index > newFPFHInstalled) {
            throw new Error(`Invalid FPFH index ${fpfh_index} in field ${field}. Must be between 1 and ${newFPFHInstalled}`);
          }

          // Check for existing image with the same category
          const existingImage = await NewFPFHsImages.findOne({
            where: {
              session_id,
              fpfh_index,
              image_category: normalizedField
            }
          });

          if (existingImage) {
            // Delete the old image file if it exists
            const oldImagePath = path.join(__dirname, '..', existingImage.image_path);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            // Delete the old image record
            await existingImage.destroy();
          }

          // Create a unique filename that includes the category to prevent collisions
          const fileExt = path.extname(file.originalname);
          const uniqueFilename = `new_fpfh_${fpfh_index}_${normalizedField}_${Date.now()}${fileExt}`;
          const relativePath = `uploads/new_fpfhs/${uniqueFilename}`;
          const fullPath = path.join(__dirname, '..', relativePath);
          
          // Ensure the directory exists
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          
          // Copy the uploaded file to the final location
          fs.copyFileSync(file.path, fullPath);
          
          // Delete the temporary upload file
          fs.unlinkSync(file.path);
          
          const image = await NewFPFHsImages.create({
            session_id,
            fpfh_index,
            image_category: normalizedField,
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
      message: `Processed ${fpfhsArray.length} FPFHs for session ${session_id}`,
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

// PUT /api/new-fpfh/:session_id/:fpfh_index
router.put('/:session_id/:fpfh_index', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id, fpfh_index } = req.params;
    let fpfhData = req.body;
    const index = parseInt(fpfh_index);

    if (isNaN(index) || index < 1) {
      return res.status(400).json({ error: 'fpfh_index must be a positive integer' });
    }

    // Handle multipart/form-data format (when uploading files)
    if (req.files && req.files.length > 0) {
      // Parse data from form data if it exists
      if (fpfhData.data && typeof fpfhData.data === 'string') {
        try {
          fpfhData = JSON.parse(fpfhData.data);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid JSON format in data field'
          });
        }
      }
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

    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          
          // Create image record
          const image = await NewFPFHsImages.create({
            session_id,
            fpfh_index: index,
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
      message: `FPFH ${index} updated successfully`,
      data: await formatFPFHData(fpfh, session_id, index)
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
      
      if (hasImageUploadFailures) {
        response.message = `FPFH ${index} updated but ${failCount} image upload(s) failed`;
      } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.json(response);
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
      data: await formatFPFHData(fpfh, session_id, index)
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