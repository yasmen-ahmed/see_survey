const express = require('express');
const router = express.Router();
const SiteLocation = require('../models/SiteLocation');

// Get all site locations
router.get('/', async (req, res) => {
  try {
    const sites = await SiteLocation.findAll();
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get site location by ID
router.get('/:id', async (req, res) => {
  try {
    const site = await SiteLocation.findByPk(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new site location
router.post('/', async (req, res) => {
  try {
    const site = await SiteLocation.create(req.body);
    res.status(201).json(site);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update site location
router.put('/:id', async (req, res) => {
  try {
    const site = await SiteLocation.findByPk(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    await site.update(req.body);
    res.json(site);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete site location
router.delete('/:id', async (req, res) => {
  try {
    const site = await SiteLocation.findByPk(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    await site.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 