const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const NewGPS = require('../models/NewGPS');
const NewGPSImages = require('../models/NewGPSImages');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

// Helper function to get images for GPS
const getGPSImages = async (sessionId) => {
  const images = await NewGPSImages.findAll({
    where: { session_id: sessionId }
  });
  
  return images.map(img => ({
    id: img.id,
    category: img.image_category,
    file_url: img.image_path
  }));
};

// Validation helper for new GPS data
const validateNewGPSData = (data) => {
  const validLocations = ['On tower', 'On building'];

  // Validate enum fields
  if (data.gps_antenna_location && !validLocations.includes(data.gps_antenna_location)) {
    throw new Error(`Invalid gps_antenna_location: ${data.gps_antenna_location}`);
  }

  // Validate numeric fields
  const numericFields = ['gps_antenna_height', 'gps_cable_length'];
  
  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      if (isNaN(data[field]) || data[field] < 0) {
        throw new Error(`${field} must be a positive number`);
      }
    }
  });
};

// Update formatGPSData to include images
const formatGPSData = async (gps, sessionId) => {
  const baseData = !gps ? {
    id: null,
    session_id: sessionId,
    gps_antenna_location: '',
    gps_antenna_height: '',
    gps_cable_length: '',
    created_at: null,
    updated_at: null
  } : gps.toJSON();
  
  // Format existing fields as before
  const stringFields = ['gps_antenna_location'];
  const numericFields = ['gps_antenna_height', 'gps_cable_length'];

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
  baseData.images = await getGPSImages(sessionId);
  
  return baseData;
};

// Update GET route to include images
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const gps = await NewGPS.findOne({ where: { session_id } });
    const formattedData = await formatGPSData(gps, session_id);

    res.json({
      session_id,
      data: formattedData,
      has_data: !!gps
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update PUT route to handle form-data and images
router.put('/:session_id', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id } = req.params;
    let gpsData = req.body;

    // Handle multipart/form-data format (when uploading files)
    if (req.files && req.files.length > 0) {
      // Parse data from form data if it exists
      if (gpsData.data && typeof gpsData.data === 'string') {
        try {
          gpsData = JSON.parse(gpsData.data);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid JSON format in data field'
          });
        }
      }
    }

    // Validate GPS data
    if (gpsData.gps_antenna_location && !['On tower', 'On building'].includes(gpsData.gps_antenna_location)) {
      return res.status(400).json({ error: 'Invalid GPS antenna location' });
    }

    let gps = await NewGPS.findOne({
      where: { session_id }
    });

    if (!gps) {
      // Create new GPS record
      gps = await NewGPS.create({
        session_id,
        ...gpsData
      });
    } else {
      // Update existing GPS record
      await gps.update(gpsData);
    }

    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          
          // Validate image field name format
          if (!field.startsWith('new_gps_1_proposed_location')) {
            throw new Error(`Invalid image field name: ${field}. Expected format: new_gps_1_proposed_location or new_gps_1_proposed_location_optional_photo`);
          }

          // Check for existing image with the same category
          const existingImage = await NewGPSImages.findOne({
            where: {
              session_id,
              image_category: field
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

          // Create a unique filename that includes the category
          const fileExt = path.extname(file.originalname);
          const uniqueFilename = `new_gps_${field}_${Date.now()}${fileExt}`;
          const relativePath = `uploads/new_gps/${uniqueFilename}`;
          const fullPath = path.join(__dirname, '..', relativePath);
          
          // Ensure the directory exists
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          
          // Copy the uploaded file to the final location
          fs.copyFileSync(file.path, fullPath);
          
          // Delete the temporary upload file
          fs.unlinkSync(file.path);
          
          const image = await NewGPSImages.create({
            session_id,
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

    const formattedData = await formatGPSData(gps, session_id);

    const response = {
      message: `GPS data for session ${session_id} updated successfully`,
      data: formattedData
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
    console.error('Error in GPS update:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/new-gps/:session_id
router.patch('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const updateData = req.body;

    // Validate update data
    try {
      validateNewGPSData(updateData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    let gps = await NewGPS.findOne({
      where: { session_id }
    });

    if (!gps) {
      // Create new GPS record with provided data
      gps = await NewGPS.create({
        session_id,
        ...updateData
      });
    } else {
      // Only update provided fields
      await gps.update(updateData);
    }

    res.json({
      message: `New GPS for session ${session_id} partially updated successfully`,
      session_id,
      data: formatGPSData(gps, session_id)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/new-gps/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const gps = await NewGPS.findOne({
      where: { session_id }
    });

    if (!gps) {
      return res.status(404).json({ 
        error: `New GPS not found for session ${session_id}` 
      });
    }

    await gps.destroy();

    res.json({
      message: `New GPS for session ${session_id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 