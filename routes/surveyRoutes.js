const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const SiteLocation = require('../models/SiteLocation');

// Get all surveys
router.get('/', async (req, res) => {
  try {
    const surveys = await Survey.findAll();
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get survey by site_id and created_at
router.get('/:siteId/:createdAt', async (req, res) => {
  try {
    const survey = await Survey.findOne({
      where: {
        site_id: req.params.siteId,
        created_at: req.params.createdAt
      }
    });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new survey
router.post('/', async (req, res) => {
  try {
    const { site_id, country, ct, project, company } = req.body;

    // Check if site exists
    let site = await SiteLocation.findByPk(site_id);
    if (!site) {
      // Create new site with default values
      site = await SiteLocation.create({
        site_id,
        sitename: "",
        region: '',
        city: '',
        longitude: 0,
        latitude: 0,
        site_elevation: 0,
        address: ''
      });
    }

    // Use ISO timestamp for created_at and session_id
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const session_id = isoTimestamp + site_id;

    // Create new survey with explicit created_at
    const survey = await Survey.create({
      site_id,
      session_id,
      country: country ,
      ct: ct ,
      project: project ,
      company: company 
    });

    res.status(201).json(survey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update survey
router.put('/:siteId/:createdAt', async (req, res) => {
  try {
    const survey = await Survey.findOne({
      where: {
        site_id: req.params.siteId,
        created_at: req.params.createdAt
      }
    });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    await survey.update(req.body);
    res.json(survey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete survey
router.delete('/:siteId/:createdAt', async (req, res) => {
  try {
    const survey = await Survey.findOne({
      where: {
        site_id: req.params.siteId,
        created_at: req.params.createdAt
      }
    });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    await survey.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 