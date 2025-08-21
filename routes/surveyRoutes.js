const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const SiteLocation = require('../models/SiteLocation');
const User = require('../models/User');

   const Country = require('../models/Country');
   const CT = require('../models/CT');
   const Project = require('../models/Project');
   const Company = require('../models/Company');
   const MU = require('../models/MU');
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

// Get current user's projects and related surveys with role-based filtering
router.get('/my-projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Getting projects and surveys for current user:', userId);
    console.log('User role:', userRole);
    
    let userProjects = [];
    let surveys = [];
    let projectNames = [];
    let projectIds = [];
    
    // Role-based filtering logic
    switch (userRole) {
      case 'admin':
        console.log('Admin role: Getting ALL projects and surveys');
        
        // Admin can see all projects
        const allProjects = await Project.findAll({
          where: { is_active: true },
          attributes: ['id', 'name', 'code', 'status', 'client']
        });
        
        userProjects = allProjects.map(project => ({
          userProjectId: null, // Admin doesn't have userProjectId for all projects
          projectId: project.id,
          projectName: project.name,
          projectCode: project.code,
          projectStatus: project.status,
          projectClient: project.client,
          isActive: true
        }));
        
        projectNames = allProjects.map(p => p.name);
        projectIds = allProjects.map(p => p.id);
        
        // Get all surveys for all projects
        surveys = await Survey.findAll({
          include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
          ],
          order: [['created_at', 'DESC']]
        });
        
        break;
        
      case 'coordinator':
        console.log('Coordinator role: Getting projects assigned to user and their surveys');
        
        // Get projects assigned to this user
        const coordinatorUserProjects = await UserProject.findAll({
          where: { 
            user_id: userId, 
            is_active: true 
          },
          include: [{ 
            model: Project, 
            as: 'project', 
            where: { is_active: true },
            attributes: ['id', 'name', 'code', 'status', 'client']
          }]
        });
        
        userProjects = coordinatorUserProjects.map(up => ({
          userProjectId: up.id,
          projectId: up.project.id,
          projectName: up.project.name,
          projectCode: up.project.code,
          projectStatus: up.project.status,
          projectClient: up.project.client,
          isActive: up.is_active
        }));
        
        projectNames = coordinatorUserProjects.map(up => up.project.name);
        projectIds = coordinatorUserProjects.map(up => up.project.id);
        
        // Get all surveys for these projects (any user can be assigned)
        if (projectNames.length > 0) {
          surveys = await Survey.findAll({
            where: {
              project: { [Op.in]: projectNames }
            },
            include: [
              { model: User, as: 'user', attributes: { exclude: ['password'] } },
              { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
            ],
            order: [['created_at', 'DESC']]
          });
        }
        
        break;
        
      case 'survey_engineer':
        console.log('Survey Engineer role: Getting only surveys assigned to this engineer');
        
        // Get projects assigned to this user (for display purposes)
        const engineerUserProjects = await UserProject.findAll({
          where: { 
            user_id: userId, 
            is_active: true 
          },
          include: [{ 
            model: Project, 
            as: 'project', 
            where: { is_active: true },
            attributes: ['id', 'name', 'code', 'status', 'client']
          }]
        });
        
        userProjects = engineerUserProjects.map(up => ({
          userProjectId: up.id,
          projectId: up.project.id,
          projectName: up.project.name,
          projectCode: up.project.code,
          projectStatus: up.project.status,
          projectClient: up.project.client,
          isActive: up.is_active
        }));
        
        projectNames = engineerUserProjects.map(up => up.project.name);
        projectIds = engineerUserProjects.map(up => up.project.id);
        
        // Get ONLY surveys that this engineer is assigned to
        surveys = await Survey.findAll({
          where: {
            user_id: userId // Only surveys assigned to this engineer
          },
          include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
          ],
          order: [['created_at', 'DESC']]
        });
        
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid role. Must be admin, coordinator, survey_engineer, or approver' 
        });
    }
    
    console.log('User projects found:', userProjects.length);
    console.log('Surveys found:', surveys.length);
    
    // Return comprehensive response
    res.json({
      message: 'User projects and related surveys retrieved successfully',
      userId,
      userRole,
      projects: userProjects,
      surveys: surveys.map(survey => ({
        session_id: survey.session_id,
        site_id: survey.site_id,
        project: survey.project,
        country: survey.country,
        ct: survey.ct,
        company: survey.company,
        TSSR_Status: survey.TSSR_Status,
        created_at: survey.created_at,
        user: survey.user ? {
          id: survey.user.id,
          username: survey.user.username,
          email: survey.user.email
        } : null,
        createdBy: survey.createdBy ? {
          id: survey.createdBy.id,
          username: survey.createdBy.username,
          email: survey.createdBy.email
        } : null
      })),
      summary: {
        totalProjects: userProjects.length,
        totalSurveys: surveys.length,
        projectNames: projectNames,
        role: userRole,
        filteringLogic: userRole === 'admin' ? 'All projects and surveys' :
                        userRole === 'coordinator' ? 'Projects assigned to user + all surveys for those projects' :
                        userRole === 'survey_engineer' ? 'Only surveys assigned to this engineer' :
                        'Submitted surveys from projects assigned to user'
      }
    });
    
  } catch (error) {
    console.error('Error getting user projects and surveys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user projects and related surveys (by userId parameter) with role-based filtering
router.get('/user-projects/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.user.role;
    const requestingUserId = req.user.id;
    
    console.log('Getting projects and surveys for user:', userId);
    console.log('Requesting user role:', userRole);
    console.log('Requesting user ID:', requestingUserId);
    
    let userProjects = [];
    let surveys = [];
    let projectNames = [];
    let projectIds = [];
    
    // Role-based filtering logic
    switch (userRole) {
      case 'admin':
        console.log('Admin role: Getting ALL projects and surveys');
        
        // Admin can see all projects
        const allProjects = await Project.findAll({
          where: { is_active: true },
          attributes: ['id', 'name', 'code', 'status', 'client']
        });
        
        userProjects = allProjects.map(project => ({
          userProjectId: null, // Admin doesn't have userProjectId for all projects
          projectId: project.id,
          projectName: project.name,
          projectCode: project.code,
          projectStatus: project.status,
          projectClient: project.client,
          isActive: true
        }));
        
        projectNames = allProjects.map(p => p.name);
        projectIds = allProjects.map(p => p.id);
        
        // Get all surveys for all projects
        surveys = await Survey.findAll({
          include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
          ],
          order: [['created_at', 'DESC']]
        });
        
        break;
        
      case 'coordinator':
        console.log('Coordinator role: Getting projects assigned to user and their surveys');
        
        // Get projects assigned to this specific user
        const coordinatorUserProjects = await UserProject.findAll({
          where: { 
            user_id: userId, 
            is_active: true 
          },
          include: [{ 
            model: Project, 
            as: 'project', 
            where: { is_active: true },
            attributes: ['id', 'name', 'code', 'status', 'client']
          }]
        });
        
        userProjects = coordinatorUserProjects.map(up => ({
          userProjectId: up.id,
          projectId: up.project.id,
          projectName: up.project.name,
          projectCode: up.project.code,
          projectStatus: up.project.status,
          projectClient: up.project.client,
          isActive: up.is_active
        }));
        
        projectNames = coordinatorUserProjects.map(up => up.project.name);
        projectIds = coordinatorUserProjects.map(up => up.project.id);
        
        // Get all surveys for these projects (any user can be assigned)
        if (projectNames.length > 0) {
          surveys = await Survey.findAll({
            where: {
              project: { [Op.in]: projectNames }
            },
            include: [
              { model: User, as: 'user', attributes: { exclude: ['password'] } },
              { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
            ],
            order: [['created_at', 'DESC']]
          });
        }
        
        break;
        
      case 'survey_engineer':
        console.log('Survey Engineer role: Getting only surveys assigned to this engineer');
        
        // Get projects assigned to this specific user (for display purposes)
        const engineerUserProjects = await UserProject.findAll({
          where: { 
            user_id: userId, 
            is_active: true 
          },
          include: [{ 
            model: Project, 
            as: 'project', 
            where: { is_active: true },
            attributes: ['id', 'name', 'code', 'status', 'client']
          }]
        });
        
        userProjects = engineerUserProjects.map(up => ({
          userProjectId: up.id,
          projectId: up.project.id,
          projectName: up.project.name,
          projectCode: up.project.code,
          projectStatus: up.project.status,
          projectClient: up.project.client,
          isActive: up.is_active
        }));
        
        projectNames = engineerUserProjects.map(up => up.project.name);
        projectIds = engineerUserProjects.map(up => up.project.id);
        
        // Get ONLY surveys that this engineer is assigned to
        surveys = await Survey.findAll({
          where: {
            user_id: userId // Only surveys assigned to this engineer
          },
          include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
          ],
          order: [['created_at', 'DESC']]
        });
        
        break;
        
      case 'approver':
        console.log('Approver role: Getting submitted and review surveys from projects assigned to user');
        
        // Get projects assigned to this specific user
        const approverUserProjects = await UserProject.findAll({
          where: { 
            user_id: userId, 
            is_active: true 
          },
          include: [{ 
            model: Project, 
            as: 'project', 
            where: { is_active: true },
            attributes: ['id', 'name', 'code', 'status', 'client']
          }]
        });
        
        userProjects = approverUserProjects.map(up => ({
          userProjectId: up.id,
          projectId: up.project.id,
          projectName: up.project.name,
          projectCode: up.project.code,
          projectStatus: up.project.status,
          projectClient: up.project.client,
          isActive: up.is_active
        }));
        
        projectNames = approverUserProjects.map(up => up.project.name);
        projectIds = approverUserProjects.map(up => up.project.id);
        
        if (projectNames.length > 0) {
          // Get current user's username for filtering
          const currentUser = await User.findByPk(requestingUserId);
          const currentUsername = currentUser ? currentUser.username : '';
          
          console.log('Current approver username:', currentUsername);
          
          // Get surveys that are submitted from projects this approver is assigned to
          const submittedSurveys = await Survey.findAll({
            where: {
              project: { [Op.in]: projectNames },
              TSSR_Status: 'submitted'
            },
            include: [
              { model: User, as: 'user', attributes: { exclude: ['password'] } },
              { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
            ],
            order: [['created_at', 'DESC']]
          });
          
          // Get surveys that are review AND were changed to review by this specific approver
          const reviewSurveys = await Survey.findAll({
            where: {
              project: { [Op.in]: projectNames },
              TSSR_Status: 'review'
            },
            include: [
              { model: User, as: 'user', attributes: { exclude: ['password'] } },
              { model: User, as: 'createdBy', attributes: { exclude: ['password'] } }
            ],
            order: [['created_at', 'DESC']]
          });
          
          // Filter review surveys to only include those changed by this approver
          const filteredReviewSurveys = [];
          
          for (const survey of reviewSurveys) {
            // Check if this survey was changed to 'review' by the current approver
            const statusHistory = await SurveyStatusHistory.findOne({
              where: {
                session_id: survey.session_id,
                new_status: 'review',
                username: currentUsername
              },
              order: [['changed_at', 'DESC']]
            });
            
            if (statusHistory) {
              // This survey was changed to 'review' by the current approver
              filteredReviewSurveys.push(survey);
            }
          }
          
          // Combine both sets of surveys
          surveys = [...submittedSurveys, ...filteredReviewSurveys];
          
          console.log('Submitted surveys found:', submittedSurveys.length);
          console.log('Review surveys found (total):', reviewSurveys.length);
          console.log('Review surveys filtered (by this approver):', filteredReviewSurveys.length);
          console.log('Total surveys for approver:', surveys.length);
        }
        
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid role. Must be admin, coordinator, survey_engineer, or approver' 
        });
    }
    
    console.log('User projects found:', userProjects.length);
    console.log('Surveys found:', surveys.length);
    
    // Return comprehensive response
    res.json({
      message: 'User projects and related surveys retrieved successfully',
      userId,
      userRole,
      projects: userProjects,
      surveys: surveys.map(survey => ({
        session_id: survey.session_id,
        site_id: survey.site_id,
        project: survey.project,
        country: survey.country,
        ct: survey.ct,
        company: survey.company,
        TSSR_Status: survey.TSSR_Status,
        created_at: survey.created_at,
        user: survey.user ? {
          id: survey.user.id,
          username: survey.user.username,
          email: survey.user.email
        } : null,
        createdBy: survey.createdBy ? {
          id: survey.createdBy.id,
          username: survey.createdBy.username,
          email: survey.createdBy.email
        } : null
      })),
      summary: {
        totalProjects: userProjects.length,
        totalSurveys: surveys.length,
        projectNames: projectNames,
        role: userRole,
        filteringLogic: userRole === 'admin' ? 'All projects and surveys' :
                        userRole === 'coordinator' ? 'Projects assigned to user + all surveys for those projects' :
                        userRole === 'survey_engineer' ? 'Only surveys assigned to this engineer' :
                        'Submitted surveys from projects assigned to user'
      }
    });
    
  } catch (error) {
    console.error('Error getting user projects and surveys:', error);
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
        attributes: [
          'site_id', 'session_id', 'user_id', 'creator_id', 'created_at',
          'country', 'ct', 'project', 'company', 'TSSR_Status'
        ],
        order: [['created_at', 'DESC']]
      });

      console.log('Surveys found (without include):', surveys.length);
      
      // If we don't have includes, we need to manually fetch user data
      if (surveys.length > 0) {
        const userIds = [...new Set([
          ...surveys.map(s => s.user_id),
          ...surveys.map(s => s.creator_id)
        ])].filter(id => id != null);
        
        if (userIds.length > 0) {
          const users = await User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id', 'username', 'email']
          });
          
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = user;
          });
          
          // Add user data to surveys
          surveys = surveys.map(survey => {
            const surveyData = survey.toJSON ? survey.toJSON() : survey;
            return {
              ...surveyData,
              user: userMap[survey.user_id] || null,
              createdBy: userMap[survey.creator_id] || null
            };
          });
        }
      }
      
   

      // Enhance surveys with lookup data
      if (surveys.length > 0) {
        const allCountries = new Set();
        const allCTs = new Set();
        const allProjects = new Set();
        const allCompanies = new Set();

        surveys.forEach(survey => {
          if (survey.country) allCountries.add(survey.country);
          if (survey.ct) allCTs.add(survey.ct);
          if (survey.project) allProjects.add(survey.project);
          if (survey.company) allCompanies.add(survey.company);
        });

        // Fetch all lookup data
        const [countries, cts, projects, companies] = await Promise.all([
          Country.findAll({ where: { name: { [Op.in]: Array.from(allCountries) } } }),
          CT.findAll({ where: { name: { [Op.in]: Array.from(allCTs) } } }),
          Project.findAll({ where: { name: { [Op.in]: Array.from(allProjects) } } }),
          Company.findAll({ where: { name: { [Op.in]: Array.from(allCompanies) } } })
        ]);

        // Create lookup maps
        const countryMap = {};
        const ctMap = {};
        const projectMap = {};
        const companyMap = {};

        countries.forEach(country => {
          countryMap[country.name] = country;
        });
        cts.forEach(ct => {
          ctMap[ct.name] = ct;
        });
        projects.forEach(project => {
          projectMap[project.name] = project;
        });
        companies.forEach(company => {
          companyMap[company.name] = company;
        });

        // Get MU data for countries
        const countryIds = [...new Set(countries.map(c => c.mu_id))];
        const mus = await MU.findAll({ where: { id: { [Op.in]: countryIds } } });
        const muMap = {};
        mus.forEach(mu => {
          muMap[mu.id] = mu;
        });

        // Enhance each survey with lookup data
        surveys = surveys.map(survey => {
          const surveyData = survey.toJSON ? survey.toJSON() : survey;
          const country = countryMap[survey.country];
          const ct = ctMap[survey.ct];
          const project = projectMap[survey.project];
          const company = companyMap[survey.company];

          return {
            ...surveyData,
            // Add lookup data
            countryData: country ? {
              id: country.id,
              name: country.name,
              code: country.code,
              mu_id: country.mu_id,
              mu: muMap[country.mu_id] ? {
                id: muMap[country.mu_id].id,
                name: muMap[country.mu_id].name
              } : null
            } : null,
            ctData: ct ? {
              id: ct.id,
              name: ct.name,
              code: ct.code,
              country_id: ct.country_id
            } : null,
            projectData: project ? {
              id: project.id,
              name: project.name,
              code: project.code,
              ct_id: project.ct_id,
              status: project.status,
              client: project.client
            } : null,
            companyData: company ? {
              id: company.id,
              name: company.name,
              code: company.code,
              project_id: company.project_id
            } : null
          };
        });
      }

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
        // Only show surveys with status 'created' and 'rework'
        whereClause = {
          [Op.and]: [
            {
              [Op.or]: [
                { creator_id: userId },
                { user_id: userId }
              ]
            },
            {
              TSSR_Status: {
                [Op.ne]: 'done' 
              }
            }
          ]
        };
        break;
        
        case 'approver':
          console.log('Approver role: Getting submitted and review surveys from projects assigned to user');
          
          // Get projects assigned to this specific user
          const approverUserProjects = await UserProject.findAll({
            where: { 
              user_id: userId, 
              is_active: true 
            },
            include: [{ 
              model: Project, 
              as: 'project', 
              where: { is_active: true },
              attributes: ['id', 'name', 'code', 'status', 'client']
            }]
          });
          
          userProjects = approverUserProjects.map(up => ({
            userProjectId: up.id,
            projectId: up.project.id,
            projectName: up.project.name,
            projectCode: up.project.code,
            projectStatus: up.project.status,
            projectClient: up.project.client,
            isActive: up.is_active
          }));
          
          projectNames = approverUserProjects.map(up => up.project.name);
          projectIds = approverUserProjects.map(up => up.project.id);
          
          if (projectNames.length > 0) {
            // Set up where clause for approver - they can see submitted and review surveys from their projects
            whereClause = {
              project: { [Op.in]: projectNames },
              TSSR_Status: { [Op.in]: ['submitted', 'review', 'done'] }
            };
            console.log('Where clause for approver:', whereClause);
          } else {
            console.log('No projects assigned to approver, returning empty array');
            return res.json([]);
          }
          
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
      // Try without includes but ensure we get all necessary fields
      console.log('Trying without includes...');
      surveys = await Survey.findAll({
        where: whereClause,
        attributes: [
          'site_id', 'session_id', 'user_id', 'creator_id', 'created_at',
          'country', 'ct', 'project', 'company', 'TSSR_Status'
        ],
        order: [['created_at', 'DESC']]
      });
      console.log('Query without includes successful');
      
      // If we don't have includes, we need to manually fetch user data
      if (surveys.length > 0) {
        const userIds = [...new Set([
          ...surveys.map(s => s.user_id),
          ...surveys.map(s => s.creator_id)
        ])].filter(id => id != null);
        
        if (userIds.length > 0) {
          const users = await User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id', 'username', 'email']
          });
          
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = user;
          });
          
          // Add user data to surveys
          surveys = surveys.map(survey => {
            const surveyData = survey.toJSON ? survey.toJSON() : survey;
            return {
              ...surveyData,
              user: userMap[survey.user_id] || null,
              createdBy: userMap[survey.creator_id] || null
            };
          });
        }
      }
    }

    console.log('Surveys found:', surveys.length);
    console.log('Survey projects:', surveys.map(s => s.project));
    console.log('Survey details:', surveys.map(s => ({
      session_id: s.session_id,
      project: s.project,
      user_id: s.user_id,
      creator_id: s.creator_id
    })));



    // Enhance surveys with lookup data
    if (surveys.length > 0) {
      // Get all unique values to minimize database queries
      const allCountries = new Set();
      const allCTs = new Set();
      const allProjects = new Set();
      const allCompanies = new Set();

      surveys.forEach(survey => {
        if (survey.country) allCountries.add(survey.country);
        if (survey.ct) allCTs.add(survey.ct);
        if (survey.project) allProjects.add(survey.project);
        if (survey.company) allCompanies.add(survey.company);
      });

      // Fetch all lookup data
      const [countries, cts, projects, companies] = await Promise.all([
        Country.findAll({ where: { name: { [Op.in]: Array.from(allCountries) } } }),
        CT.findAll({ where: { name: { [Op.in]: Array.from(allCTs) } } }),
        Project.findAll({ where: { name: { [Op.in]: Array.from(allProjects) } } }),
        Company.findAll({ where: { name: { [Op.in]: Array.from(allCompanies) } } })
      ]);

      // Create lookup maps
      const countryMap = {};
      const ctMap = {};
      const projectMap = {};
      const companyMap = {};

      countries.forEach(country => {
        countryMap[country.name] = country;
      });
      cts.forEach(ct => {
        ctMap[ct.name] = ct;
      });
      projects.forEach(project => {
        projectMap[project.name] = project;
      });
      companies.forEach(company => {
        companyMap[company.name] = company;
      });

      // Get MU data for countries
      const countryIds = [...new Set(countries.map(c => c.mu_id))];
      const mus = await MU.findAll({ where: { id: { [Op.in]: countryIds } } });
      const muMap = {};
      mus.forEach(mu => {
        muMap[mu.id] = mu;
      });

      // Enhance each survey with lookup data
      surveys = surveys.map(survey => {
        const surveyData = survey.toJSON ? survey.toJSON() : survey;
        const country = countryMap[survey.country];
        const ct = ctMap[survey.ct];
        const project = projectMap[survey.project];
        const company = companyMap[survey.company];

        return {
          ...surveyData,
          // Add lookup data
          countryData: country ? {
            id: country.id,
            name: country.name,
            code: country.code,
            mu_id: country.mu_id,
            mu: muMap[country.mu_id] ? {
              id: muMap[country.mu_id].id,
              name: muMap[country.mu_id].name
            } : null
          } : null,
          ctData: ct ? {
            id: ct.id,
            name: ct.name,
            code: ct.code,
            country_id: ct.country_id
          } : null,
          projectData: project ? {
            id: project.id,
            name: project.name,
            code: project.code,
            ct_id: project.ct_id,
            status: project.status,
            client: project.client
          } : null,
          companyData: company ? {
            id: company.id,
            name: company.name,
            code: company.code,
            project_id: company.project_id
          } : null
        };
      });
    }

    // Special filtering for approver role - filter review surveys to only show those changed by this approver
    if (userRole === 'approver' && surveys.length > 0) {
      console.log('Applying approver-specific filtering for review surveys');
      
      // Get current user's username for filtering
      const currentUser = await User.findByPk(userId);
      const currentUsername = currentUser ? currentUser.username : '';
      
      console.log('Current approver username for filtering:', currentUsername);
      
      // Filter surveys to only include review surveys that were changed by this approver
      const filteredSurveys = [];
      
      for (const survey of surveys) {
        if (survey.TSSR_Status === 'submitted') {
          // Include all submitted surveys
          filteredSurveys.push(survey);
        } else if (survey.TSSR_Status === 'review') {
          // For review surveys, check if this approver changed the status
          const statusHistory = await SurveyStatusHistory.findOne({
            where: {
              session_id: survey.session_id,
              new_status: 'review',
              username: currentUsername
            },
            order: [['changed_at', 'DESC']]
          });
          
          if (statusHistory) {
            // This survey was changed to 'review' by the current approver
            filteredSurveys.push(survey);
            console.log(`Including review survey ${survey.session_id} - changed by ${currentUsername}`);
          } else {
            console.log(`Excluding review survey ${survey.session_id} - not changed by ${currentUsername}`);
          }
        } else {
          // Include surveys with other statuses
          filteredSurveys.push(survey);
        }
      }
      
      surveys = filteredSurveys;
      console.log(`Approver filtering complete: ${filteredSurveys.length} surveys remaining out of ${surveys.length} total`);
    }

    // Add rework flag for survey_engineer role
    if (userRole === 'survey_engineer' && surveys.length > 0) {
      console.log('Adding rework flag for survey engineer');
      
      surveys = surveys.map(survey => {
        const surveyData = survey.toJSON ? survey.toJSON() : survey;
        return {
          ...surveyData,
          isRework: surveyData.TSSR_Status === 'rework'
        };
      });
      
      console.log(`Added rework flag to ${surveys.length} surveys for survey engineer`);
    }

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
    const { site_id, user_id, country_id, ct_id, project_id, company_id, mu_id } = req.body;

    console.log('Creating survey with payload:', req.body);

    // Validate required fields
    if (!site_id) {
      return res.status(400).json({ error: 'site_id is required' });
    }
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

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



    // Look up the actual values from the IDs
    let countryName = '';
    let ctName = '';
    let projectName = '';
    let companyName = '';

    // Validate and fetch country
    if (country_id) {
      try {
        const country = await Country.findByPk(country_id);
        if (!country) {
          return res.status(400).json({ error: `Country with ID ${country_id} not found` });
        }
        countryName = country.name;
      } catch (error) {
        console.log('Error fetching country:', error.message);
        return res.status(400).json({ error: 'Invalid country ID' });
      }
    }

    // Validate and fetch CT
    if (ct_id) {
      try {
        const ct = await CT.findByPk(ct_id);
        if (!ct) {
          return res.status(400).json({ error: `CT with ID ${ct_id} not found` });
        }
        ctName = ct.name;
      } catch (error) {
        console.log('Error fetching CT:', error.message);
        return res.status(400).json({ error: 'Invalid CT ID' });
      }
    }

    // Validate and fetch project
    if (project_id) {
      try {
        const project = await Project.findByPk(project_id);
        if (!project) {
          return res.status(400).json({ error: `Project with ID ${project_id} not found` });
        }
        projectName = project.name;
      } catch (error) {
        console.log('Error fetching project:', error.message);
        return res.status(400).json({ error: 'Invalid project ID' });
      }
    }

    // Validate and fetch company
    if (company_id) {
      try {
        const company = await Company.findByPk(company_id);
        if (!company) {
          return res.status(400).json({ error: `Company with ID ${company_id} not found` });
        }
        companyName = company.name;
      } catch (error) {
        console.log('Error fetching company:', error.message);
        return res.status(400).json({ error: 'Invalid company ID' });
      }
    }

    console.log('Resolved values:', {
      country: countryName,
      ct: ctName,
      project: projectName,
      company: companyName
    });

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
      country: countryName,
      ct: ctName,
      project: projectName,
      company: companyName
    });

    console.log('Survey created successfully:', survey.toJSON());

    // Create notification for survey creation
    try {
      const NotificationService = require('../services/NotificationService');
      await NotificationService.createSurveyCreatedNotification(
        survey.session_id,
        creator_id,
        survey.project // Pass the project name instead of project_id
      );
    } catch (notificationError) {
      console.error('Error creating survey creation notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    // Create notification for survey assignment (if assigned to someone other than creator)
    if (user_id !== creator_id) {
      try {
        const NotificationService = require('../services/NotificationService');
        await NotificationService.createAssignmentNotification(
          survey.session_id,
          user_id,
          creator_id,
          project_id
        );
      } catch (notificationError) {
        console.error('Error creating assignment notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    res.status(201).json(survey);
  } catch (error) {
    console.error('Error creating survey:', error);
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

    // Create notification for status change
    try {
      const NotificationService = require('../services/NotificationService');
      await NotificationService.createStatusChangeNotification(
        session_id,
        currentStatus,
        TSSR_Status,
        req.user.id,
        survey.project, // Pass the project name
        survey.user_id // Pass the assigned user ID
      );
    } catch (notificationError) {
      console.error('Error creating status change notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

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

// Get survey details by session ID
router.get('/:session_id', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const survey = await Survey.findOne({
      where: { session_id },
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: User, as: 'createdBy', attributes: { exclude: ['password'] } },
        { model: Project, as: 'projectData' }
      ]
    });
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json({
      session_id: survey.session_id,
      site_id: survey.site_id,
      project: survey.projectData?.name || survey.project,
      TSSR_Status: survey.TSSR_Status,
      created_at: survey.created_at,
      user: survey.user,
      createdBy: survey.createdBy
    });
  } catch (error) {
    console.error("Error fetching survey details:", error);
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