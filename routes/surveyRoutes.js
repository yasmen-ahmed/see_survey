const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const SiteLocation = require('../models/SiteLocation');
const User = require('../models/User');
const Project = require('../models/Project');
const UserProject = require('../models/UserProject');
const SurveyStatusHistory = require('../models/SurveyStatusHistory');
const authenticateToken = require('../middleware/authMiddleware');
const moment = require('moment');
const { Op } = require('sequelize');

// Test endpoint without authentication
router.get('/test', async (req, res) => {
  res.json({ message: 'Test endpoint working', headers: req.headers });
});

// Test endpoint with authentication to check user data
router.get('/test-auth', authenticateToken, async (req, res) => {
  try {
    console.log('Test auth endpoint - req.user:', req.user);
    
    // Check if user exists in database
    const user = await User.findByPk(req.user.id);
    
    res.json({
      message: 'Authentication test successful',
      userFromToken: req.user,
      userFromDatabase: user ? {
        id: user.id,
        username: user.username,
        email: user.email
      } : null,
      userExists: !!user
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check coordinator projects
router.get('/test-coordinator-projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Testing coordinator projects for user:', { userId, userRole });
    
    if (userRole !== 'coordinator') {
      return res.json({ message: 'User is not a coordinator', userRole });
    }
    
    // Get user's assigned projects
    const userProjects = await UserProject.findAll({
      where: { user_id: userId, is_active: true },
      include: [{ model: Project, as: 'project', where: { is_active: true } }]
    });
    
    // Get all surveys to see what projects exist
    const allSurveys = await Survey.findAll({
      attributes: ['project'],
      group: ['project']
    });
    
    // Get all surveys with full details
    const allSurveysFull = await Survey.findAll({
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
      ]
    });
    
    res.json({
      message: 'Coordinator projects test',
      userId,
      userRole,
      userProjects: userProjects.map(up => ({
        userProjectId: up.id,
        projectId: up.project_id,
        projectName: up.project?.name,
        isActive: up.is_active
      })),
      projectNames: userProjects.map(up => up.project?.name),
      allSurveyProjects: allSurveys.map(s => s.project),
      allSurveys: allSurveysFull.map(s => ({
        session_id: s.session_id,
        project: s.project,
        createdBy: s.createdBy?.username,
        assignedTo: s.user?.username
      }))
    });
  } catch (error) {
    console.error('Test coordinator projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all surveys with role-based filtering (no authentication required)
router.get('/role/:role', async (req, res) => {
  try {
    const userRole = req.params.role;
    const userId = req.query.userId; // Optional userId for specific user filtering
    
    console.log('GET /surveys/role/:role - userRole:', userRole, 'userId:', userId);

    let whereClause = {};
    let includeClause = [
      { model: User, as: 'user', attributes: { exclude: ['password'] } },
      { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
    ];

    // Role-based filtering
    switch (userRole) {
      case 'admin':
        // Admin can see all surveys
        break;
        
      case 'coordinator':
        // Coordinator can see surveys related to projects they are assigned to
        if (!userId) {
          return res.status(400).json({ error: 'userId is required for coordinator role' });
        }
        
        console.log('Coordinator filtering - userId:', userId);
        
        const coordinatorProjects = await UserProject.findAll({
          where: { user_id: userId, is_active: true },
          include: [{ model: Project, as: 'project', where: { is_active: true } }]
        });
        
        console.log('Coordinator projects found:', coordinatorProjects.length);
        
        const coordinatorProjectNames = coordinatorProjects.map(up => up.project.name);
        console.log('Coordinator project names:', coordinatorProjectNames);
        
        if (coordinatorProjectNames.length > 0) {
          // Coordinator should see ALL surveys for their assigned projects
          whereClause.project = { [Op.in]: coordinatorProjectNames };
          console.log('Where clause for coordinator:', whereClause);
        } else {
          console.log('No projects assigned to coordinator, returning empty array');
          return res.json([]);
        }
        break;
        
      case 'survey_engineer':
        // Survey Engineer can see surveys they created or are assigned to
        if (!userId) {
          return res.status(400).json({ error: 'userId is required for survey_engineer role' });
        }
        
        whereClause = {
          [Op.or]: [
            { creator_id: userId },
            { user_id: userId }
          ]
        };
        break;
        
      case 'approver':
        // Approver can see surveys with status 'submitted' or 'review'
        whereClause.TSSR_Status = { [Op.in]: ['submitted', 'review'] };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid role. Must be admin, coordinator, survey_engineer, or approver' });
    }

    console.log('Final where clause:', whereClause);
    console.log('Include clause:', includeClause);

    try {
      const surveys = await Survey.findAll({
        where: whereClause,
        include: includeClause,
        order: [['created_at', 'DESC']]
      });

      console.log('Surveys found:', surveys.length);
      console.log('Survey details:', surveys.map(s => ({
        session_id: s.session_id,
        project: s.project,
        user_id: s.user_id,
        creator_id: s.creator_id
      })));

      res.json(surveys);
    } catch (includeError) {
      console.log('Query with include failed, trying without include:', includeError.message);
      
      const surveys = await Survey.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      console.log('Surveys found (without include):', surveys.length);
      res.json(surveys);
    }

  } catch (error) {
    console.error('Error fetching surveys by role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all surveys with role-based filtering (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /surveys - req.user:', req.user);
    const userRole = req.user.role;
    const userId = req.user.id;
    const username = req.user.username;
    
    console.log('User details:', { userRole, userId, username });

    // Verify user exists in database
    const userExists = await User.findByPk(userId);
    console.log('User exists in database:', !!userExists);
    if (!userExists) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    let whereClause = {};
    let includeClause = [
      { model: User, as: 'user', attributes: { exclude: ['password'] } },
      { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
    ];

    // For debugging, let's try without includes first
    let useIncludes = true;

    // Role-based filtering
    switch (userRole) {
      case 'admin':
        // Admin can see all surveys
        break;
        
      case 'coordinator':
        // Coordinator can see surveys related to projects they are assigned to
        console.log('Coordinator filtering - userId:', userId);
        
        const coordinatorProjects = await UserProject.findAll({
          where: { user_id: userId, is_active: true },
          include: [{ model: Project, as: 'project', where: { is_active: true } }]
        });
        
        console.log('Coordinator projects found:', coordinatorProjects.length);
        console.log('Coordinator projects:', coordinatorProjects.map(up => ({
          userProjectId: up.id,
          projectId: up.project_id,
          projectName: up.project?.name,
          isActive: up.is_active
        })));
        
        const coordinatorProjectNames = coordinatorProjects.map(up => up.project.name);
        const coordinatorProjectIds = coordinatorProjects.map(up => up.project_id);
        console.log('Coordinator project names:', coordinatorProjectNames);
        console.log('Coordinator project IDs:', coordinatorProjectIds);
        
        if (coordinatorProjectNames.length > 0) {
          // Coordinator should see ALL surveys for their assigned projects
          // This includes surveys created by or assigned to anyone within those projects
          whereClause.project = { [Op.in]: coordinatorProjectNames };
          console.log('Where clause for coordinator (by name):', whereClause);
          console.log('Coordinator will see ALL surveys for projects:', coordinatorProjectNames);
        } else {
          console.log('No projects assigned to coordinator, returning empty array');
          // If no projects assigned, return empty array
          return res.json([]);
        }
        break;
        
      case 'survey_engineer':
        // Survey Engineer can see surveys they created or are assigned to
        whereClause = {
          [Op.or]: [
            { creator_id: userId },
            { user_id: userId }
          ]
        };
        break;
        
      case 'approver':
        // Approver can see surveys with status 'submitted' or 'review'
        whereClause.TSSR_Status = { [Op.in]: ['submitted', 'review'] };
        break;
        
      default:
        // Default: show all surveys (fallback)
        break;
    }

    console.log('Final where clause:', whereClause);
    
    console.log('About to query surveys with whereClause:', JSON.stringify(whereClause, null, 2));
    console.log('Include clause:', JSON.stringify(includeClause, null, 2));
    
    let surveys;
    try {
      // Try with includes first
      surveys = await Survey.findAll({
        where: whereClause,
        include: includeClause,
        order: [['created_at', 'DESC']]
      });
      console.log('Query with includes successful');
    } catch (error) {
      console.log('Query with includes failed:', error.message);
      // Try without includes
      console.log('Trying without includes...');
      surveys = await Survey.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });
      console.log('Query without includes successful');
    }

    console.log('Surveys found:', surveys.length);
    console.log('Survey projects:', surveys.map(s => s.project));
    console.log('Survey details:', surveys.map(s => ({
      session_id: s.session_id,
      project: s.project,
      user_id: s.user_id,
      creator_id: s.creator_id
    })));

    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
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

// Update survey status by session_id with history tracking
router.put('/:session_id/status', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    const { TSSR_Status, notes } = req.body; // Expecting { "TSSR_Status": "new_status", "notes": "optional notes" }
    const username = req.user.username;

    // Log the received status value
    console.log("Received TSSR_Status:", TSSR_Status);

    // Validate the status value
    const validStatuses = ['created', 'submitted', 'review', 'rework', 'done'];
    if (!validStatuses.includes(TSSR_Status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Find the survey by session_id
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Store the current status before updating
    const currentStatus = survey.TSSR_Status;

    // Update the status
    survey.TSSR_Status = TSSR_Status;
    await survey.save();

    // Record the status change in history
    await SurveyStatusHistory.create({
      session_id,
      username,
      current_status: currentStatus,
      new_status: TSSR_Status,
      changed_at: new Date(),
      notes: notes || null
    });

    console.log(`Status updated from ${currentStatus} to ${TSSR_Status} by ${username}`);

    res.json(survey);
  } catch (error) {
    console.error("Error updating survey status:", error);
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

// Get status history for a survey
router.get('/:session_id/status-history', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;

    const statusHistory = await SurveyStatusHistory.findAll({
      where: { session_id },
      order: [['changed_at', 'DESC']]
    });

    res.json(statusHistory);
  } catch (error) {
    console.error("Error fetching status history:", error);
    res.status(500).json({ error: error.message });
  }
});

// Remove all surveys (DANGEROUS - Use with caution!)
router.delete('/all', async (req, res) => {
  try {
    console.log('Attempting to remove all surveys...');
    
    // Get count before deletion for logging
    const surveyCount = await Survey.count();
    console.log(`Found ${surveyCount} surveys to delete`);
    
    if (surveyCount === 0) {
      return res.json({ 
        message: 'No surveys found to delete',
        deletedCount: 0 
      });
    }

    // Import all models that have session_id foreign keys
    const SiteAccess = require('../models/SiteAccess');
    const SiteImages = require('../models/SiteImages');
    const AntennaStructure = require('../models/AntennaStructure');
    const AntennaStructureImages = require('../models/AntennaStructureImages');
    const AntennaImages = require('../models/AntennaImages');
    const RadioUnitImages = require('../models/RadioUnitImages');
    const AcConnectionImages = require('../models/AcConnectionImages');
    const AcPanelImages = require('../models/AcPanelImages');
    const PowerMeterImages = require('../models/PowerMeterImages');
    const OutdoorCabinetsImages = require('../models/OutdoorCabinetsImages');
    const OutdoorGeneralLayoutImages = require('../models/OutdoorGeneralLayoutImages');
    const RANEquipmentImages = require('../models/RANEquipmentImages');
    const TransmissionMWImages = require('../models/TransmissionMWImages');
    const DCPowerSystemImages = require('../models/DCPowerSystemImages');
    const ExternalDCDistributionImages = require('../models/ExternalDCDistributionImages');
    const MWAntennasImages = require('../models/MWAntennasImages');
    const NewAntennasImages = require('../models/NewAntennasImages');
    const NewRadioUnitsImages = require('../models/NewRadioUnitsImages');
    const NewGPSImages = require('../models/NewGPSImages');
    const NewFPFHsImages = require('../models/NewFPFHsImages');
    const SurveyStatusHistory = require('../models/SurveyStatusHistory');
    const OutdoorCabinets = require('../models/OutdoorCabinets');
    const RANEquipment = require('../models/RANEquipment');
    const NewAntennas = require('../models/NewAntennas');
    const NewRadioUnits = require('../models/NewRadioUnits');
    const NewGPS = require('../models/NewGPS');
    const NewFPFHs = require('../models/NewFPFHs');
    const NewMW = require('../models/NewMW');
    const NewMWImage = require('../models/NewMWImage');
    const NewRadioInstallations = require('../models/NewRadioInstallations');
    const AcConnectionInfo = require('../models/AcConnectionInfo');
    const AcPanel = require('../models/AcPanel');
    const PowerMeter = require('../models/PowerMeter');
    const OutdoorGeneralLayout = require('../models/OutdoorGeneralLayout');
    const DCPowerSystem = require('../models/DCPowerSystem');
    const TransmissionMW = require('../models/TransmissionMW');
    const SiteVisitInfo = require('../models/SiteVisitInfo');
    const AntennaConfiguration = require('../models/AntennaConfiguration');
    const HealthSafetyBTSAccess = require('../models/HealthSafetyBTSAccess');
    const HealthSafetySiteAccess = require('../models/HealthSafetySiteAccess');
    const ExternalDCDistribution = require('../models/ExternalDCDistribution');

    // Get all session_ids from surveys
    const surveys = await Survey.findAll({
      attributes: ['session_id']
    });
    const sessionIds = surveys.map(s => s.session_id);
    
    console.log(`Found ${sessionIds.length} session IDs to clean up`);

    // Delete related records in the correct order (child tables first)
    const deletionResults = {};

    // Delete image tables first (they reference other tables)
    deletionResults.antennaStructureImages = await AntennaStructureImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.antennaImages = await AntennaImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.radioUnitImages = await RadioUnitImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.acConnectionImages = await AcConnectionImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.acPanelImages = await AcPanelImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.powerMeterImages = await PowerMeterImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.outdoorCabinetsImages = await OutdoorCabinetsImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.outdoorGeneralLayoutImages = await OutdoorGeneralLayoutImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.ranEquipmentImages = await RANEquipmentImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.transmissionMWImages = await TransmissionMWImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.dcPowerSystemImages = await DCPowerSystemImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.externalDCDistributionImages = await ExternalDCDistributionImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.mwAntennasImages = await MWAntennasImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newAntennasImages = await NewAntennasImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newRadioUnitsImages = await NewRadioUnitsImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newGPSImages = await NewGPSImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newFPFHsImages = await NewFPFHsImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newMWImage = await NewMWImage.destroy({ where: { session_id: { [Op.in]: sessionIds } } });

    // Delete main data tables
    deletionResults.siteAccess = await SiteAccess.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.siteImages = await SiteImages.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.antennaStructure = await AntennaStructure.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.outdoorCabinets = await OutdoorCabinets.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.ranEquipment = await RANEquipment.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newAntennas = await NewAntennas.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newRadioUnits = await NewRadioUnits.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newGPS = await NewGPS.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newFPFHs = await NewFPFHs.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newMW = await NewMW.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.newRadioInstallations = await NewRadioInstallations.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.acConnectionInfo = await AcConnectionInfo.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.acPanel = await AcPanel.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.powerMeter = await PowerMeter.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.outdoorGeneralLayout = await OutdoorGeneralLayout.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.dcPowerSystem = await DCPowerSystem.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.transmissionMW = await TransmissionMW.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.siteVisitInfo = await SiteVisitInfo.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.antennaConfiguration = await AntennaConfiguration.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.healthSafetyBTSAccess = await HealthSafetyBTSAccess.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.healthSafetySiteAccess = await HealthSafetySiteAccess.destroy({ where: { session_id: { [Op.in]: sessionIds } } });
    deletionResults.externalDCDistribution = await ExternalDCDistribution.destroy({ where: { session_id: { [Op.in]: sessionIds } } });

    // Delete status history
    deletionResults.surveyStatusHistory = await SurveyStatusHistory.destroy({ where: { session_id: { [Op.in]: sessionIds } } });

    // Finally, delete the surveys
    const deletedCount = await Survey.destroy({
      where: {},
      truncate: false
    });
    
    console.log(`Successfully deleted ${deletedCount} surveys and all related data`);
    console.log('Deletion results:', deletionResults);
    
    res.json({ 
      message: `Successfully deleted ${deletedCount} surveys and all related data`,
      deletedCount: deletedCount,
      relatedDataDeleted: deletionResults
    });
  } catch (error) {
    console.error('Error deleting all surveys:', error);
    res.status(500).json({ error: error.message });
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