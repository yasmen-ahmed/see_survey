const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const SiteLocation = require('../models/SiteLocation');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const moment = require('moment');

// Get all surveys
router.get('/', async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
      ]
    });
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { site_id, user_id, country, ct, project, company } = req.body;

    // Validate selected user exists
    const selectedUser = await User.findByPk(user_id);
    if (!selectedUser) {
      return res.status(400).json({ error: 'Selected user not found' });
    }

    // Creator is the logged-in user
    const creator_id = req.user.userId;
    // Validate creator exists (should always be true)
    const creatorUser = await User.findByPk(creator_id);
    if (!creatorUser) {
      return res.status(401).json({ error: 'Invalid token user' });
    }

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
    const now = moment().toISOString();
    const session_id = now + site_id;

    // Create new survey
    const survey = await Survey.create({
      site_id,
      session_id,
      user_id,
      creator_id,
      created_at: now,
      country: country || '',
      ct: ct || '',
      project: project || '',
      company: company || ''
    });

    res.status(201).json(survey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update survey status by session_id
router.put('/:session_id/status', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { TSSR_Status } = req.body; // Expecting { "TSSR_Status": "new_status" }

    // Log the received status value
    console.log("Received TSSR_Status:", TSSR_Status);

    // Validate the status value
    const validStatuses = ['created', 'submitted', 'review', 'done'];
    if (!validStatuses.includes(TSSR_Status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Find the survey by session_id
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Update the status
    survey.TSSR_Status = TSSR_Status;
    await survey.save();

    res.json(survey);
  } catch (error) {
    console.error("Error updating survey status:", error); // Log the full error
    res.status(500).json({ error: error.message });
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