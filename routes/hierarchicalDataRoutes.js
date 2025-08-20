const express = require('express');
const router = express.Router();
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');
const sequelize = require('../config/database');

// Create a junction table for MU-Country many-to-many relationship
const MUCountry = sequelize.define('MUCountry', {
  id: {
    type: sequelize.constructor.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mu_id: {
    type: sequelize.constructor.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'mus',
      key: 'id'
    }
  },
  country_id: {
    type: sequelize.constructor.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'countries',
      key: 'id'
    }
  }
}, {
  tableName: 'mu_countries',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['mu_id', 'country_id']
    }
  ]
});

// Get all MUs
router.get('/mus', async (req, res) => {
  try {
    const mus = await MU.findAll({
      order: [['name', 'ASC']]
    });

    res.json(mus);
  } catch (error) {
    console.error('Error fetching MUs:', error);
    res.status(500).json({ error: 'Failed to fetch MUs' });
  }
});

// Get countries by MU (many-to-many relationship)
router.get('/countries/:muId', async (req, res) => {
  try {
    const muId = req.params.muId;
    
    // Use raw SQL query to get countries for this MU through the junction table
    const countries = await sequelize.query(`
      SELECT c.* 
      FROM countries c
      INNER JOIN mu_countries mc ON c.id = mc.country_id
      WHERE mc.mu_id = :muId
      ORDER BY c.name ASC
    `, {
      replacements: { muId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries for MU:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Get CTs by country
router.get('/cts/:countryId', async (req, res) => {
  try {
    const countryId = req.params.countryId;
    
    const cts = await CT.findAll({
      where: { country_id: countryId },
      order: [['name', 'ASC']]
    });

    res.json(cts);
  } catch (error) {
    console.error('Error fetching CTs:', error);
    res.status(500).json({ error: 'Failed to fetch CTs' });
  }
});

// Get projects by CT
router.get('/projects/:ctId', async (req, res) => {
  try {
    const ctId = req.params.ctId;
    
    const projects = await Project.findAll({
      where: { ct_id: ctId },
      order: [['name', 'ASC']]
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get companies by project
router.get('/companies/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    const companies = await Company.findAll({
      where: { project_id: projectId },
      order: [['name', 'ASC']]
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get all countries (for admin purposes)
router.get('/countries', async (req, res) => {
  try {
    const countries = await Country.findAll({
      order: [['name', 'ASC']]
    });

    res.json(countries);
  } catch (error) {
    console.error('Error fetching all countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Get all CTs (for admin purposes)
router.get('/cts', async (req, res) => {
  try {
    const cts = await CT.findAll({
      order: [['name', 'ASC']]
    });

    res.json(cts);
  } catch (error) {
    console.error('Error fetching all CTs:', error);
    res.status(500).json({ error: 'Failed to fetch CTs' });
  }
});

// Get all projects (for admin purposes)
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['name', 'ASC']]
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get all companies (for admin purposes)
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['name', 'ASC']]
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching all companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get hierarchical data for a specific MU (for debugging)
router.get('/hierarchy/:muId', async (req, res) => {
  try {
    const muId = req.params.muId;
    
    const mu = await MU.findByPk(muId);
    if (!mu) {
      return res.status(404).json({ error: 'MU not found' });
    }

    // Get countries for this MU using raw SQL
    const countries = await sequelize.query(`
      SELECT c.* 
      FROM countries c
      INNER JOIN mu_countries mc ON c.id = mc.country_id
      WHERE mc.mu_id = :muId
      ORDER BY c.name ASC
    `, {
      replacements: { muId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get CTs for each country
    const countriesWithCTs = await Promise.all(
      countries.map(async (country) => {
        const cts = await CT.findAll({
          where: { country_id: country.id },
          order: [['name', 'ASC']]
        });

        // Get projects for each CT
        const ctsWithProjects = await Promise.all(
          cts.map(async (ct) => {
            const projects = await Project.findAll({
              where: { ct_id: ct.id },
              order: [['name', 'ASC']]
            });

            // Get companies for each project
            const projectsWithCompanies = await Promise.all(
              projects.map(async (project) => {
                const companies = await Company.findAll({
                  where: { project_id: project.id },
                  order: [['name', 'ASC']]
                });

                return {
                  ...project.toJSON(),
                  companies
                };
              })
            );

            return {
              ...ct.toJSON(),
              projects: projectsWithCompanies
            };
          })
        );

        return {
          ...country,
          cts: ctsWithProjects
        };
      })
    );

    res.json({
      mu: mu.toJSON(),
      countries: countriesWithCTs
    });
  } catch (error) {
    console.error('Error fetching hierarchical data:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchical data' });
  }
});

module.exports = router; 