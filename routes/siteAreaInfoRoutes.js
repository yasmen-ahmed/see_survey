const express = require('express');
const router = express.Router();
const SiteAreaInfo = require('../models/SiteAreaInfo');

// GET by session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const entry = await SiteAreaInfo.findOne({ where: { session_id } });
    if (!entry) {
      // Return default object with all fields as empty string
      return res.json({
        site_located_at: '',
        site_ownership: '',
        shared_site: '',
        other_telecom_operator_exist_onsite: [],
        ac_power_sharing: '',
        dc_power_sharing: '',
        site_topology: '',
        site_type: '',
        planned_scope: [],
        location_of_existing_telecom_racks_cabinets: [],
        location_of_planned_new_telecom_racks_cabinets: [],
        existing_technology: []
      });
    }
    const result = entry.toJSON();
    // Convert comma-separated strings to arrays for checkbox fields
    const arrayFields = [
      'other_telecom_operator_exist_onsite',
      'planned_scope',
      'location_of_existing_telecom_racks_cabinets',
      'location_of_planned_new_telecom_racks_cabinets',
      'existing_technology'
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

// PUT (upsert) by session_id
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const [entry] = await SiteAreaInfo.findOrCreate({
      where: { session_id },
      defaults: { session_id }
    });
    const data = { ...req.body };
    const arrayFields = [
      'other_telecom_operator_exist_onsite',
      'planned_scope',
      'location_of_existing_telecom_racks_cabinets',
      'location_of_planned_new_telecom_racks_cabinets',
      'existing_technology'
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
