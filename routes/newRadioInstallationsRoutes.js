const express = require('express');
const router = express.Router();
const NewRadioInstallations = require('../models/NewRadioInstallations');

// Validation helper for new radio installations data
const validateNewRadioInstallationsData = (data) => {
  // Validate numeric fields
  const numericFields = [
    'new_sectors_planned',
    'new_radio_units_planned', 
    'existing_radio_units_swapped',
    'new_antennas_planned',
    'existing_antennas_swapped',
    'new_fpfh_installed'
  ];
  
  numericFields.forEach(field => {
    if (data[field] !== undefined) {
      if (!Number.isInteger(data[field]) || data[field] < 1 || data[field] > 20) {
        throw new Error(`${field} must be an integer between 1 and 20`);
      }
    }
  });
  
  // Validate JSON fields
  const jsonArrayFields = ['sectors_config', 'radio_units_config', 'antennas_config', 'fpfh_config'];
  jsonArrayFields.forEach(field => {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      throw new Error(`${field} must be an array`);
    }
  });
  
  if (data.gps_config !== undefined && (typeof data.gps_config !== 'object' || Array.isArray(data.gps_config))) {
    throw new Error('gps_config must be an object');
  }
};

// Helper function to get default empty data structure
const getDefaultEmptyData = (sessionId) => {
  return {
    session_id: sessionId,
    new_sectors_planned: 1,
    new_radio_units_planned: 1,
    existing_radio_units_swapped: 1,
    new_antennas_planned: 1,
    existing_antennas_swapped: 1,
    new_fpfh_installed: 1,
    created_at: null,
    updated_at: null
  };
};

// GET /api/new-radio-installations/:session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Try to find existing data
    let newRadioInstallations = await NewRadioInstallations.findOne({
      where: { session_id }
    });
    
    // If no data exists, return default empty structure
    if (!newRadioInstallations) {
      const defaultData = getDefaultEmptyData(session_id);
      return res.json(defaultData);
    }
    
    res.json(newRadioInstallations.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/new-radio-installations/:session_id
router.post('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const installationData = req.body;
    
    // Validate installation data
    try {
      validateNewRadioInstallationsData(installationData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Check if data already exists for this session
    let newRadioInstallations = await NewRadioInstallations.findOne({
      where: { session_id }
    });
    
    if (newRadioInstallations) {
      // Update existing record
      await newRadioInstallations.update(installationData);
      res.json({
        message: 'New radio installations data updated successfully',
        data: newRadioInstallations.toJSON()
      });
    } else {
      // Create new record
      newRadioInstallations = await NewRadioInstallations.create({
        session_id,
        ...installationData
      });
      res.status(201).json({
        message: 'New radio installations data created successfully',
        data: newRadioInstallations.toJSON()
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-installations/:session_id
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const installationData = req.body;
    
    // Validate installation data
    try {
      validateNewRadioInstallationsData(installationData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    let newRadioInstallations = await NewRadioInstallations.findOne({
      where: { session_id }
    });
    
    if (!newRadioInstallations) {
      // Create new record if it doesn't exist
      newRadioInstallations = await NewRadioInstallations.create({
        session_id,
        ...installationData
      });
    } else {
      // Update existing record
      await newRadioInstallations.update(installationData);
    }
    
    res.json({
      message: 'New radio installations data updated successfully',
      data: newRadioInstallations.toJSON()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-installations/:session_id
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const updateData = req.body;
    
    // Validate update data
    try {
      validateNewRadioInstallationsData(updateData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    let newRadioInstallations = await NewRadioInstallations.findOne({
      where: { session_id }
    });
    
    if (!newRadioInstallations) {
      // Create new record with provided data
      newRadioInstallations = await NewRadioInstallations.create({
        session_id,
        ...updateData
      });
    } else {
      // Only update provided fields
      await newRadioInstallations.update(updateData);
    }
    
    res.json({
      message: 'New radio installations data partially updated successfully',
      data: newRadioInstallations.toJSON()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/new-radio-installations/:session_id/section/:section_name
// Update specific section (sectors, radio-units, antennas, fpfh, gps)
router.put('/:session_id/section/:section_name', async (req, res) => {
  try {
    const { session_id, section_name } = req.params;
    const sectionData = req.body;
    
    const validSections = ['sectors', 'radio-units', 'antennas', 'fpfh', 'gps'];
    if (!validSections.includes(section_name)) {
      return res.status(400).json({ 
        error: `Invalid section name. Valid sections: ${validSections.join(', ')}` 
      });
    }
    
    let newRadioInstallations = await NewRadioInstallations.findOne({
      where: { session_id }
    });
    
    if (!newRadioInstallations) {
      // Create new record with default data
      newRadioInstallations = await NewRadioInstallations.create({
        session_id,
        ...getDefaultEmptyData(session_id)
      });
    }
    
    // Update specific section
    const updateData = {};
    
    switch (section_name) {
      case 'sectors':
        if (sectionData.new_sectors_planned !== undefined) {
          updateData.new_sectors_planned = sectionData.new_sectors_planned;
        }
        if (sectionData.sectors_config !== undefined) {
          updateData.sectors_config = sectionData.sectors_config;
        }
        break;
        
      case 'radio-units':
        if (sectionData.new_radio_units_planned !== undefined) {
          updateData.new_radio_units_planned = sectionData.new_radio_units_planned;
        }
        if (sectionData.existing_radio_units_swapped !== undefined) {
          updateData.existing_radio_units_swapped = sectionData.existing_radio_units_swapped;
        }
        if (sectionData.radio_units_config !== undefined) {
          updateData.radio_units_config = sectionData.radio_units_config;
        }
        break;
        
      case 'antennas':
        if (sectionData.new_antennas_planned !== undefined) {
          updateData.new_antennas_planned = sectionData.new_antennas_planned;
        }
        if (sectionData.existing_antennas_swapped !== undefined) {
          updateData.existing_antennas_swapped = sectionData.existing_antennas_swapped;
        }
        if (sectionData.antennas_config !== undefined) {
          updateData.antennas_config = sectionData.antennas_config;
        }
        break;
        
      case 'fpfh':
        if (sectionData.new_fpfh_installed !== undefined) {
          updateData.new_fpfh_installed = sectionData.new_fpfh_installed;
        }
        if (sectionData.fpfh_config !== undefined) {
          updateData.fpfh_config = sectionData.fpfh_config;
        }
        break;
        
      case 'gps':
        if (sectionData.gps_config !== undefined) {
          updateData.gps_config = sectionData.gps_config;
        }
        break;
    }
    
    // Validate update data
    try {
      validateNewRadioInstallationsData(updateData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    await newRadioInstallations.update(updateData);
    
    res.json({
      message: `${section_name} section updated successfully`,
      data: newRadioInstallations.toJSON()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/new-radio-installations/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const newRadioInstallations = await NewRadioInstallations.findOne({
      where: { session_id }
    });
    
    if (!newRadioInstallations) {
      return res.status(404).json({ 
        error: 'New radio installations data not found for this session' 
      });
    }
    
    await newRadioInstallations.destroy();
    
    res.json({
      message: 'New radio installations data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/new-radio-installations/ (Admin - get all records)
router.get('/', async (req, res) => {
  try {
    const newRadioInstallations = await NewRadioInstallations.findAll({
      order: [['updated_at', 'DESC']]
    });
    
    res.json(newRadioInstallations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 