const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');

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
    const survey = await Survey.create(req.body);
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