const Survey = require('./models/Survey');
const User = require('./models/User');
const SiteLocation = require('./models/SiteLocation');
const sequelize = require('./config/database');
const moment = require('moment');

async function createTestSurvey() {
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
    const siteId = 'TEST_SITE_001';
    let site = await SiteLocation.findByPk(siteId);
    if (!site) {
      site = await SiteLocation.create({
        site_id: siteId,
        sitename: "Test Site for Coordinator",
        region: 'Test Region',
        city: 'Test City',
        longitude: 0,
        latitude: 0,
        site_elevation: 0,
        address: 'Test Address'
      });
      console.log('Created test site:', siteId);
    }

    // Create a test survey for "New Project"
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
      project: 'New Project', // This should match the project name
      company: 'Test Company',
      TSSR_Status: 'created'
    });

    console.log('Created test survey:', {
      session_id: survey.session_id,
      project: survey.project,
      assigned_to: coordinator.username,
      created_by: coordinator.username
    });

    console.log('Test survey created successfully!');
    console.log('Now login as coordinator and check if they can see this survey.');

  } catch (error) {
    console.error('Error creating test survey:', error);
  } finally {
    await sequelize.close();
  }
}

createTestSurvey(); 