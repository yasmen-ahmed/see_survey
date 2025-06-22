const express = require('express');
const router = express.Router();
const HealthSafetySiteAccess = require('../models/HealthSafetySiteAccess');
const Survey = require('../models/Survey');

// Get Health & Safety Site Access by session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    let entry = await HealthSafetySiteAccess.findOne({ where: { session_id } });
    
    if (!entry) {
      // Return default template with empty values
      return res.json({
        session_id,
        access_road_safe_condition: '',
        site_access_safe_secure: '',
        safe_usage_access_ensured: '',
        site_safe_environmental_influence: '',
        permanent_fence_correctly_installed: '',
        access_egress_equipment_safe: '',
        designated_walkway_routes_tripping: '',
        designated_walkway_routes_radiation: '',
        emergency_exits_clearly_visible: '',
        vehicles_good_condition_nsn_rules: '',
        rubbish_unused_material_removed: '',
        safe_manual_handling_practices: '',
        ladder_length_adequate: '',
        special_permits_required: '',
        ladders_good_condition: '',
        has_data: false
      });
    }

    const result = entry.toJSON();
    result.has_data = true;
    res.json(result);

  } catch (error) {
    console.error('Error fetching Health & Safety Site Access:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update Health & Safety Site Access by session_id
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
      'access_road_safe_condition',
      'site_access_safe_secure', 
      'safe_usage_access_ensured',
      'site_safe_environmental_influence',
      'permanent_fence_correctly_installed',
      'access_egress_equipment_safe',
      'designated_walkway_routes_tripping',
      'designated_walkway_routes_radiation',
      'emergency_exits_clearly_visible',
      'vehicles_good_condition_nsn_rules',
      'rubbish_unused_material_removed',
      'safe_manual_handling_practices',
      'ladder_length_adequate',
      'special_permits_required',
      'ladders_good_condition'
    ];

    for (const field of enumFields) {
      if (req.body[field] && !validValues.includes(req.body[field])) {
        return res.status(400).json({
          error: `Invalid value for ${field}. Must be one of: ${validValues.join(', ')}`
        });
      }
    }

    const [entry, created] = await HealthSafetySiteAccess.findOrCreate({
      where: { session_id },
      defaults: { session_id, ...req.body }
    });

    if (!created) {
      await entry.update(req.body);
    }

    res.json({
      message: created ? 'Health & Safety Site Access created successfully' : 'Health & Safety Site Access updated successfully',
      data: entry,
      created
    });

  } catch (error) {
    console.error('Error creating/updating Health & Safety Site Access:', error);
    res.status(400).json({ error: error.message });
  }
});

// Partial update Health & Safety Site Access by session_id
router.patch('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const entry = await HealthSafetySiteAccess.findOne({ where: { session_id } });
    if (!entry) {
      return res.status(404).json({ 
        error: `Health & Safety Site Access with session_id '${session_id}' not found.` 
      });
    }

    // Validate enum values for fields that are being updated
    const validValues = ['Yes', 'No', 'Not applicable'];
    const enumFields = [
      'access_road_safe_condition',
      'site_access_safe_secure', 
      'safe_usage_access_ensured',
      'site_safe_environmental_influence',
      'permanent_fence_correctly_installed',
      'access_egress_equipment_safe',
      'designated_walkway_routes_tripping',
      'designated_walkway_routes_radiation',
      'emergency_exits_clearly_visible',
      'vehicles_good_condition_nsn_rules',
      'rubbish_unused_material_removed',
      'safe_manual_handling_practices',
      'ladder_length_adequate',
      'special_permits_required',
      'ladders_good_condition'
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
      message: 'Health & Safety Site Access updated successfully',
      data: entry
    });

  } catch (error) {
    console.error('Error updating Health & Safety Site Access:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete Health & Safety Site Access by session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const entry = await HealthSafetySiteAccess.findOne({ where: { session_id } });
    if (!entry) {
      return res.status(404).json({ 
        error: `Health & Safety Site Access with session_id '${session_id}' not found.` 
      });
    }

    await entry.destroy();

    res.json({
      message: 'Health & Safety Site Access deleted successfully',
      session_id
    });

  } catch (error) {
    console.error('Error deleting Health & Safety Site Access:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 