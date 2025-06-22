const express = require('express');
const router = express.Router();
const HealthSafetyBTSAccess = require('../models/HealthSafetyBTSAccess');
const Survey = require('../models/Survey');

// Get Health & Safety BTS Access by session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    let entry = await HealthSafetyBTSAccess.findOne({ where: { session_id } });
    
    if (!entry) {
      // Return default template with empty values
      return res.json({
        session_id,
        safety_climbing_system_correctly_installed: '',
        walking_path_situated_safety_specifications: '',
        mw_antennas_height_exclusion_zone: '',
        non_authorized_access_antennas_prevented: '',
        bts_pole_access_lighting_sufficient: '',
        safe_access_bts_poles_granted: '',
        pathway_blocks_walking_grids_installed: '',
        has_data: false
      });
    }

    const result = entry.toJSON();
    result.has_data = true;
    res.json(result);

  } catch (error) {
    console.error('Error fetching Health & Safety BTS Access:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update Health & Safety BTS Access by session_id
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Check if the session_id exists in the survey table
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(400).json({ 
        error: `Survey with session_id '${session_id}' not found. Please create a survey first.` 
      });
    }

    // Validate enum values
    const validValues = ['Yes', 'No', 'Not applicable'];
    const enumFields = [
      'safety_climbing_system_correctly_installed',
      'walking_path_situated_safety_specifications',
      'mw_antennas_height_exclusion_zone',
      'non_authorized_access_antennas_prevented',
      'bts_pole_access_lighting_sufficient',
      'safe_access_bts_poles_granted',
      'pathway_blocks_walking_grids_installed'
    ];

    for (const field of enumFields) {
      if (req.body[field] && !validValues.includes(req.body[field])) {
        return res.status(400).json({
          error: `Invalid value for ${field}. Must be one of: ${validValues.join(', ')}`
        });
      }
    }

    const [entry, created] = await HealthSafetyBTSAccess.findOrCreate({
      where: { session_id },
      defaults: { session_id, ...req.body }
    });

    if (!created) {
      await entry.update(req.body);
    }

    res.json({
      message: created ? 'Health & Safety BTS Access created successfully' : 'Health & Safety BTS Access updated successfully',
      data: entry,
      created
    });

  } catch (error) {
    console.error('Error creating/updating Health & Safety BTS Access:', error);
    res.status(400).json({ error: error.message });
  }
});

// Partial update Health & Safety BTS Access by session_id
router.patch('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const entry = await HealthSafetyBTSAccess.findOne({ where: { session_id } });
    if (!entry) {
      return res.status(404).json({ 
        error: `Health & Safety BTS Access with session_id '${session_id}' not found.` 
      });
    }

    // Validate enum values for fields that are being updated
    const validValues = ['Yes', 'No', 'Not applicable'];
    const enumFields = [
      'safety_climbing_system_correctly_installed',
      'walking_path_situated_safety_specifications',
      'mw_antennas_height_exclusion_zone',
      'non_authorized_access_antennas_prevented',
      'bts_pole_access_lighting_sufficient',
      'safe_access_bts_poles_granted',
      'pathway_blocks_walking_grids_installed'
    ];

    for (const field of enumFields) {
      if (req.body[field] && !validValues.includes(req.body[field])) {
        return res.status(400).json({
          error: `Invalid value for ${field}. Must be one of: ${validValues.join(', ')}`
        });
      }
    }

    await entry.update(req.body);

    res.json({
      message: 'Health & Safety BTS Access updated successfully',
      data: entry
    });

  } catch (error) {
    console.error('Error updating Health & Safety BTS Access:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete Health & Safety BTS Access by session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const entry = await HealthSafetyBTSAccess.findOne({ where: { session_id } });
    if (!entry) {
      return res.status(404).json({ 
        error: `Health & Safety BTS Access with session_id '${session_id}' not found.` 
      });
    }

    await entry.destroy();

    res.json({
      message: 'Health & Safety BTS Access deleted successfully',
      session_id
    });

  } catch (error) {
    console.error('Error deleting Health & Safety BTS Access:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 