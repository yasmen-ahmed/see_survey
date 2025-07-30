const Survey = require('./models/Survey');
const User = require('./models/User');
const SiteLocation = require('./models/SiteLocation');
const sequelize = require('./config/database');
const moment = require('moment');

async function createTestSurveyY25() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Find the coordinator user
    const coordinator = await User.findOne({
      where: { username: 'coordinator.role' }
    });

    if (!coordinator) {
      console.log('Coordinator user not found');
      return;
    }

    console.log('Found coordinator:', coordinator.username);

    // Create a test site if it doesn't exist
    const siteId = 'TEST_SITE_Y25_001';
    let site = await SiteLocation.findByPk(siteId);
    if (!site) {
      site = await SiteLocation.create({
        site_id: siteId,
        sitename: "Test Site for Y25 Project",
        region: 'Test Region',
        city: 'Test City',
        longitude: 0,
        latitude: 0,
        site_elevation: 0,
        address: 'Test Address'
      });
      console.log('Created test site:', siteId);
    }

    // Create a test survey for "Y25 FDD & TDD Upgrade 2025-26"
    const now = moment().toISOString();
    const sessionId = now + siteId;

    const survey = await Survey.create({
      site_id: siteId,
      session_id: sessionId,
      user_id: coordinator.id, // Assign to coordinator
      creator_id: coordinator.id, // Created by coordinator
      created_at: now,
      country: 'Test Country',
      ct: 'Test CT',
      project: 'Y25 FDD & TDD Upgrade 2025-26', // This should match the project name
      company: 'Test Company',
      TSSR_Status: 'created'
    });

    console.log('Created test survey for Y25 project:', {
      session_id: survey.session_id,
      project: survey.project,
      assigned_to: coordinator.username,
      created_by: coordinator.username
    });

    // Create another test survey for "New Project" assigned to a different user
    const admin = await User.findOne({
      where: { username: 'admin.role' }
    });

    if (admin) {
      const siteId2 = 'TEST_SITE_NEW_002';
      let site2 = await SiteLocation.findByPk(siteId2);
      if (!site2) {
        site2 = await SiteLocation.create({
          site_id: siteId2,
          sitename: "Test Site for New Project",
          region: 'Test Region',
          city: 'Test City',
          longitude: 0,
          latitude: 0,
          site_elevation: 0,
          address: 'Test Address'
        });
        console.log('Created test site:', siteId2);
      }

      const now2 = moment().toISOString();
      const sessionId2 = now2 + siteId2;

      const survey2 = await Survey.create({
        site_id: siteId2,
        session_id: sessionId2,
        user_id: admin.id, // Assign to admin
        creator_id: admin.id, // Created by admin
        created_at: now2,
        country: 'Test Country',
        ct: 'Test CT',
        project: 'New Project', // This should match the project name
        company: 'Test Company',
        TSSR_Status: 'submitted'
      });

      console.log('Created test survey for New Project (by admin):', {
        session_id: survey2.session_id,
        project: survey2.project,
        assigned_to: admin.username,
        created_by: admin.username
      });
    }

    console.log('Test surveys created successfully!');
    console.log('Now login as coordinator and check if they can see these surveys.');

  } catch (error) {
    console.error('Error creating test surveys:', error);
  } finally {
    await sequelize.close();
  }
}

createTestSurveyY25(); 