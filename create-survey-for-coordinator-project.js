const Survey = require('./models/Survey');
const User = require('./models/User');
const SiteLocation = require('./models/SiteLocation');
const sequelize = require('./config/database');
const moment = require('moment');

async function createSurveyForCoordinatorProject() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Find users
    const coordinator = await User.findOne({ where: { username: 'coordinator.role' } });
    const admin = await User.findOne({ where: { username: 'admin.role' } });
    const siteEngineer = await User.findOne({ where: { username: 'siteengineer.role' } });

    if (!coordinator || !admin || !siteEngineer) {
      console.log('Some users not found');
      return;
    }

    console.log('Found users:', {
      coordinator: coordinator.username,
      admin: admin.username,
      siteEngineer: siteEngineer.username
    });

    // Create test sites
    const sites = [
      { id: 'SITE_Y25_001', name: 'Test Site Y25 001' },
      { id: 'SITE_Y25_002', name: 'Test Site Y25 002' },
      { id: 'SITE_Y25_003', name: 'Test Site Y25 003' }
    ];

    for (const siteInfo of sites) {
      let site = await SiteLocation.findByPk(siteInfo.id);
      if (!site) {
        site = await SiteLocation.create({
          site_id: siteInfo.id,
          sitename: siteInfo.name,
          region: 'Test Region',
          city: 'Test City',
          longitude: 0,
          latitude: 0,
          site_elevation: 0,
          address: 'Test Address'
        });
        console.log('Created site:', siteInfo.id);
      }
    }

    // Create surveys for "Y25 FDD & TDD Upgrade 2025-26" project
    const projectName = 'Y25 FDD & TDD Upgrade 2025-26';
    const surveys = [
      {
        siteId: 'SITE_Y25_001',
        userId: coordinator.id,
        creatorId: coordinator.id,
        status: 'created'
      },
      {
        siteId: 'SITE_Y25_002',
        userId: admin.id,
        creatorId: admin.id,
        status: 'submitted'
      },
      {
        siteId: 'SITE_Y25_003',
        userId: siteEngineer.id,
        creatorId: siteEngineer.id,
        status: 'review'
      }
    ];

    for (const surveyInfo of surveys) {
      const now = moment().toISOString();
      const sessionId = now + surveyInfo.siteId;

      const survey = await Survey.create({
        site_id: surveyInfo.siteId,
        session_id: sessionId,
        user_id: surveyInfo.userId,
        creator_id: surveyInfo.creatorId,
        created_at: now,
        country: 'Test Country',
        ct: 'Test CT',
        project: projectName,
        company: 'Test Company',
        TSSR_Status: surveyInfo.status
      });

      console.log('Created survey:', {
        session_id: survey.session_id,
        project: survey.project,
        site_id: survey.site_id,
        user_id: survey.user_id,
        creator_id: survey.creator_id,
        status: survey.TSSR_Status
      });
    }

    console.log('\nTest surveys created successfully!');
    console.log(`Created 3 surveys for project: "${projectName}"`);
    console.log('Now login as coordinator and check if they can see these surveys.');

  } catch (error) {
    console.error('Error creating surveys:', error);
  } finally {
    await sequelize.close();
  }
}

createSurveyForCoordinatorProject(); 