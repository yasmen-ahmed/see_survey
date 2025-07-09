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

    console.log('Original request body:', req.body);

    // Parse the data if it's a string
    if (typeof gpsData.data === 'string') {
      try {
        const parsedData = JSON.parse(gpsData.data);
        console.log('Parsed data:', parsedData);
        
        // Map the frontend field names to backend field names
        gpsData = {
          gps_antenna_location: parsedData.gps_antenna_location,
          gps_antenna_height: parseFloat(parsedData.gps_antenna_height),
          gps_cable_length: parseFloat(parsedData.gps_cable_length)
        };
      } catch (error) {
        console.error('Error parsing data:', error);
        return res.status(400).json({ error: 'Invalid JSON format in data field' });
      }
    }

    console.log('Processed GPS data:', gpsData);

    // Validate the data
    if (!gpsData.gps_antenna_location) {
      return res.status(400).json({ error: 'GPS antenna location is required' });
    }

    if (!['On tower', 'On building'].includes(gpsData.gps_antenna_location)) {
      return res.status(400).json({ error: 'Invalid GPS antenna location' });
    }

    if (typeof gpsData.gps_antenna_height !== 'number' || gpsData.gps_antenna_height < 0) {
      return res.status(400).json({ error: 'GPS antenna height must be a positive number' });
    }

    if (typeof gpsData.gps_cable_length !== 'number' || gpsData.gps_cable_length < 0) {
      return res.status(400).json({ error: 'GPS cable length must be a positive number' });
    }

    // Find or create the GPS record
    let [gps, created] = await NewGPS.findOrCreate({
      where: { session_id },
      defaults: gpsData
    });

    if (!created) {
      // Update existing record
      await gps.update(gpsData);
      console.log('Updated existing GPS record:', gps.toJSON());
    } else {
      console.log('Created new GPS record:', gps.toJSON());
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const field = file.fieldname;
        
        if (!field.startsWith('new_gps_1_proposed_location')) {
          continue; // Skip invalid image fields
        }

        // Handle existing image
        const existingImage = await NewGPSImages.findOne({
          where: { session_id, image_category: field }
        });

        if (existingImage) {
          const oldImagePath = path.join(__dirname, '..', existingImage.image_path);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          await existingImage.destroy();
        }

        // Save new image
        const fileExt = path.extname(file.originalname);
        const uniqueFilename = `new_gps_${field}_${Date.now()}${fileExt}`;
        const relativePath = `uploads/new_gps/${uniqueFilename}`;
        const fullPath = path.join(__dirname, '..', relativePath);
        
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.copyFileSync(file.path, fullPath);
        fs.unlinkSync(file.path);
        
        await NewGPSImages.create({
          session_id,
          image_category: field,
          image_path: relativePath
        });
      }
    }

    // Get updated data with images
    const formattedData = await formatGPSData(gps, session_id);
    console.log('Final formatted data:', formattedData);

    res.json({
      message: `GPS data for session ${session_id} updated successfully`,
      data: formattedData
    });

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