const express = require('express');
const router = express.Router();
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');

// Get all MUs
router.get('/mus', async (req, res) => {
  try {
    const mus = await MU.findAll({
      order: [['name', 'ASC']]
    });
    res.json(mus);
  } catch (error) {
    console.error('Error fetching MUs:', error);
    res.status(500).json({ message: 'Failed to fetch MUs', error: error.message });
  }
});

// Create new MU
router.post('/mus', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'MU name is required' });
    }
    
    // Check if MU already exists
    const existingMU = await MU.findOne({ where: { name } });
    if (existingMU) {
      return res.status(409).json({ message: 'MU already exists', data: existingMU });
    }
    
    const mu = await MU.create({
      name,
      code: code || name.toUpperCase()
    });
    
    res.status(201).json({ message: 'MU created successfully', data: mu });
  } catch (error) {
    console.error('Error creating MU:', error);
    res.status(500).json({ message: 'Failed to create MU', error: error.message });
  }
});

// Get countries by MU
router.get('/countries/:muId', async (req, res) => {
  try {
    const { muId } = req.params;
    const countries = await Country.findAll({
      where: { mu_id: muId },
      order: [['name', 'ASC']]
    });
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Failed to fetch countries', error: error.message });
  }
});

// Create new Country
router.post('/countries', async (req, res) => {
  try {
    const { name, code, mu_id } = req.body;
    
    if (!name || !mu_id) {
      return res.status(400).json({ message: 'Country name and MU ID are required' });
    }
    
    // Check if country already exists for this MU
    const existingCountry = await Country.findOne({ 
      where: { name, mu_id } 
    });
    if (existingCountry) {
      return res.status(409).json({ message: 'Country already exists for this MU', data: existingCountry });
    }
    
    const country = await Country.create({
      name,
      code: code || name.substring(0, 2).toUpperCase(),
      mu_id
    });
    
    res.status(201).json({ message: 'Country created successfully', data: country });
  } catch (error) {
    console.error('Error creating Country:', error);
    res.status(500).json({ message: 'Failed to create Country', error: error.message });
  }
});

// Get CTs by country
router.get('/cts/:countryId', async (req, res) => {
  try {
    const { countryId } = req.params;
    const cts = await CT.findAll({
      where: { country_id: countryId },
      order: [['name', 'ASC']]
    });
    res.json(cts);
  } catch (error) {
    console.error('Error fetching CTs:', error);
    res.status(500).json({ message: 'Failed to fetch CTs', error: error.message });
  }
});

// Create new CT
router.post('/cts', async (req, res) => {
  try {
    const { name, code, country_id } = req.body;
    
    if (!name || !country_id) {
      return res.status(400).json({ message: 'CT name and Country ID are required' });
    }
    
    // Check if CT already exists for this country
    const existingCT = await CT.findOne({ 
      where: { name, country_id } 
    });
    if (existingCT) {
      return res.status(409).json({ message: 'CT already exists for this country', data: existingCT });
    }
    
    const ct = await CT.create({
      name,
      code: code || `${name.substring(0, 6).toUpperCase()}_CT`,
      country_id
    });
    
    res.status(201).json({ message: 'CT created successfully', data: ct });
  } catch (error) {
    console.error('Error creating CT:', error);
    res.status(500).json({ message: 'Failed to create CT', error: error.message });
  }
});

// Get projects by CT
router.get('/projects/:ctId', async (req, res) => {
  try {
    const { ctId } = req.params;
    const projects = await Project.findAll({
      where: { ct_id: ctId },
      order: [['name', 'ASC']]
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
});

// Create new Project
router.post('/projects', async (req, res) => {
  try {
    const { name, code, ct_id } = req.body;
    
    if (!name || !ct_id) {
      return res.status(400).json({ message: 'Project name and CT ID are required' });
    }
    
    // Check if project already exists for this CT
    const existingProject = await Project.findOne({ 
      where: { name, ct_id } 
    });
    if (existingProject) {
      return res.status(409).json({ message: 'Project already exists for this CT', data: existingProject });
    }
    
    const project = await Project.create({
      name,
      code: code || `${name.substring(0, 6).toUpperCase()}_PROJ`,
      ct_id
    });
    
    res.status(201).json({ message: 'Project created successfully', data: project });
  } catch (error) {
    console.error('Error creating Project:', error);
    res.status(500).json({ message: 'Failed to create Project', error: error.message });
  }
});

// Get companies by project
router.get('/companies/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const companies = await Company.findAll({
      where: { project_id: projectId },
      order: [['name', 'ASC']]
    });
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Failed to fetch companies', error: error.message });
  }
});

// Create new Company
router.post('/companies', async (req, res) => {
  try {
    const { name, code, project_id } = req.body;
    
    if (!name || !project_id) {
      return res.status(400).json({ message: 'Company name and Project ID are required' });
    }
    
    // Check if company already exists for this project
    const existingCompany = await Company.findOne({ 
      where: { name, project_id } 
    });
    if (existingCompany) {
      return res.status(409).json({ message: 'Company already exists for this project', data: existingCompany });
    }
    
    const company = await Company.create({
      name,
      code: code || `${name.substring(0, 6).toUpperCase()}_COMP`,
      project_id
    });
    
    res.status(201).json({ message: 'Company created successfully', data: company });
  } catch (error) {
    console.error('Error creating Company:', error);
    res.status(500).json({ message: 'Failed to create Company', error: error.message });
  }
});

// Get complete hierarchy for a specific path (for debugging/validation)
router.get('/hierarchy/:muId/:countryId/:ctId/:projectId', async (req, res) => {
  try {
    const { muId, countryId, ctId, projectId } = req.params;
    
    const hierarchy = await MU.findOne({
      where: { id: muId },
      include: [{
        model: Country,
        as: 'countries',
        where: { id: countryId },
        include: [{
          model: CT,
          as: 'cts',
          where: { id: ctId },
          include: [{
            model: Project,
            as: 'projects',
            where: { id: projectId },
            include: [{
              model: Company,
              as: 'companies'
            }]
          }]
        }]
      }]
    });
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ message: 'Failed to fetch hierarchy', error: error.message });
  }
});

module.exports = router; 