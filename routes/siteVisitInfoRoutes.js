const express = require('express');
const router = express.Router();
const SiteVisitInfo = require('../models/SiteVisitInfo');
const Survey = require('../models/Survey');
const User = require('../models/User');

// Get all site visit info entries for a session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    let entries = await SiteVisitInfo.findAll({ where: { session_id } });
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(400).json({ error: 'Invalid session_id' });
    }
    const user = await User.findByPk(survey.user_id);
    if (!user) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }
    if (entries.length === 0) {
      // No records: return default template with empty strings
      entries = [{
        id: null,
        session_id,
        survey_date: null,
      surveyor_name: `${user.firstName} ${user.lastName}`,
        subcontractor_company: survey.company,
        surveyor_phone: user.phone,
        nokia_representative_name: '',
        nokia_representative_title: '',
        customer_representative_name: '',
        customer_representative_title: ''
      }];
    }
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new site visit info entry
router.post('/', async (req, res) => {
  try {
    const {
      session_id,
      survey_date,
      nokia_representative_name,
      nokia_representative_title,
      customer_representative_name,
      customer_representative_title
    } = req.body;

    // Validate that the survey exists
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(400).json({ error: 'Invalid session_id' });
    }

    // Fetch the assigned user for surveyor info
    const user = await User.findByPk(survey.user_id);
    if (!user) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    const entry = await SiteVisitInfo.create({
      session_id,
      survey_date,
      subcontractor_company: survey.company || '',
      surveyor_name: `${user.firstName} ${user.lastName}`,
      surveyor_phone: user.phone || '',
      nokia_representative_name: nokia_representative_name || '',
      nokia_representative_title: nokia_representative_title || '',
      customer_representative_name: customer_representative_name || '',
      customer_representative_title: customer_representative_title || ''
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update site visit info entry by session_id (upsert)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const {
      survey_date,
      nokia_representative_name,
      nokia_representative_title,
      customer_representative_name,
      customer_representative_title
    } = req.body;

    // Validate that the survey exists
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(400).json({ error: 'Invalid session_id' });
    }

    // Fetch the assigned user for surveyor info
    const user = await User.findByPk(survey.user_id);
    if (!user) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    // Upsert: find or create with default and auto-populated values
    const [entry] = await SiteVisitInfo.findOrCreate({
      where: { session_id },
      defaults: {
        session_id,
        survey_date: survey_date || new Date(),
        subcontractor_company: survey.company || '',
        surveyor_name: `${user.firstName} ${user.lastName}`,
        surveyor_phone: user.phone || '',
        nokia_representative_name: '',
        nokia_representative_title: '',
        customer_representative_name: '',
        customer_representative_title: ''
      }
    });

    // Update with provided values or auto-populated
    await entry.update({
      survey_date: survey_date || entry.survey_date,
      subcontractor_company: survey.company || entry.subcontractor_company,
      surveyor_name: `${user.firstName} ${user.lastName}`,
      surveyor_phone: user.phone || entry.surveyor_phone,
      nokia_representative_name: nokia_representative_name ?? entry.nokia_representative_name,
      nokia_representative_title: nokia_representative_title ?? entry.nokia_representative_title,
      customer_representative_name: customer_representative_name ?? entry.customer_representative_name,
      customer_representative_title: customer_representative_title ?? entry.customer_representative_title
    });

    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 