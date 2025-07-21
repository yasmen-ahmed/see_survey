const express = require('express');
const router = express.Router();
const SiteAccess = require('../models/SiteAccess');
const Survey = require('../models/Survey');

// Get by session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const entry = await SiteAccess.findOne({ where: { session_id } });
    if (!entry) {
      // No record: return default template with empty strings
      return res.json({
        site_access_permission_required: '',
        contact_person_name: '',
        contact_tel_number: '',
        available_access_time: '',
        type_of_gated_fence: '',
        keys_type: '',    
        stair_lift_height: 0,     
        stair_lift_width: 0,
        stair_lift_depth: 0,
        preferred_time_slot_crane_access: '',
        access_to_site_by_road: '',
        keys_required: '',
        material_accessibility_to_site: '',
        contact_person_name_for_site_key: '',
        contact_tel_number_for_site_key: '',
        // New access problems fields
        environment_cultural_problems: '',
        environment_cultural_problems_details: '',
        aviation_problems: '',
        aviation_problems_details: '',
        military_problems: '',
        military_problems_details: '',
        why_crane_needed: '',
        need_crane_permission: ''
      });
    }
    const result = entry.toJSON();
    const arrayFields = [
      'preferred_time_slot_crane_access',
      'available_access_time',
      'keys_type',
      'material_accessibility_to_site'
    ];
    arrayFields.forEach(field => {
      if (typeof result[field] === 'string' && result[field] !== '') {
        result[field] = result[field].split(',');
      } else {
        result[field] = [];
      }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update by session_id (upsert)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // First, check if the session_id exists in the survey table
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(400).json({ 
        error: `Survey with session_id '${session_id}' not found. Please create a survey first.` 
      });
    }
    
    const [entry] = await SiteAccess.findOrCreate({
      where: { session_id },
      defaults: { session_id }
    });
    const data = { ...req.body };
    const arrayFields = [
      'preferred_time_slot_crane_access',
      'available_access_time',
      'keys_type',
      'material_accessibility_to_site'
    ];
    arrayFields.forEach(field => {
      if (Array.isArray(data[field])) {
        data[field] = data[field].join(',');
      }
    });
    await entry.update(data);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
