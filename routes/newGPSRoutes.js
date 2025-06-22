const express = require('express');
const router = express.Router();
const NewGPS = require('../models/NewGPS');

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

// Helper function to format GPS data with default empty strings
const formatGPSData = (gps, sessionId) => {
  if (!gps) {
    return {
      id: null,
      session_id: sessionId,
      gps_antenna_location: '',
      gps_antenna_height: '',
      gps_cable_length: '',
      created_at: null,
      updated_at: null
    };
  }

  const data = gps.toJSON();
  
  // Convert null values to empty strings for string fields
  const stringFields = ['gps_antenna_location'];
  const numericFields = ['gps_antenna_height', 'gps_cable_length'];

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

// GET /api/new-gps/:session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const gps = await NewGPS.findOne({ where: { session_id } });
    const formattedData = formatGPSData(gps, session_id);

    res.json({
      session_id,
      data: formattedData,
      has_data: !!gps
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/new-gps/:session_id
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const gpsData = req.body;

    // Validate GPS data
    try {
      validateNewGPSData(gpsData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
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

    res.json({
      message: `New GPS for session ${session_id} updated successfully`,
      session_id,
      data: formatGPSData(gps, session_id)
    });
  } catch (error) {
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