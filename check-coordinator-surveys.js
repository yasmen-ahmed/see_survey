const Survey = require('./models/Survey');
const UserProject = require('./models/UserProject');
const Project = require('./models/Project');
const sequelize = require('./config/database');

async function checkCoordinatorSurveys() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Get coordinator's assigned projects
    const coordinatorProjects = await UserProject.findAll({
      where: { user_id: 3, is_active: true } // coordinator user ID is 3
    });

    console.log('Coordinator assigned project IDs:', coordinatorProjects.map(up => up.project_id));

    // Get project names for these IDs
    const projectIds = coordinatorProjects.map(up => up.project_id);
    const projects = await Project.findAll({
      where: { id: projectIds, is_active: true }
    });

    console.log('Coordinator assigned projects:');
    projects.forEach(project => {
      console.log(`- Project ID: ${project.id}, Name: "${project.name}"`);
    });

    const coordinatorProjectNames = projects.map(project => project.name);
    console.log('\nCoordinator project names:', coordinatorProjectNames);

    // Get all surveys for coordinator's projects
    const surveys = await Survey.findAll({
      where: {
        project: coordinatorProjectNames
      }
    });

    console.log(`\nSurveys found for coordinator's projects: ${surveys.length}`);
    
    if (surveys.length > 0) {
      console.log('\nSurvey details:');
      surveys.forEach((survey, index) => {
        console.log(`${index + 1}. Session ID: ${survey.session_id}`);
        console.log(`   Project: "${survey.project}"`);
        console.log(`   User ID: ${survey.user_id}`);
        console.log(`   Creator ID: ${survey.creator_id}`);
        console.log(`   Status: ${survey.TSSR_Status}`);
        console.log('');
      });
    } else {
      console.log('No surveys found for coordinator\'s projects.');
    }

    // Check all surveys to see what projects exist
    const allSurveys = await Survey.findAll({
      where: {
        project: {
          [require('sequelize').Op.ne]: null,
          [require('sequelize').Op.ne]: ''
        }
      }
    });

    const allProjectNames = [...new Set(allSurveys.map(s => s.project))];
    console.log('\nAll project names in surveys:');
    allProjectNames.forEach(project => {
      console.log(`- "${project}"`);
    });

    // Check if coordinator's project names match any survey project names
    console.log('\nMatching projects:');
    coordinatorProjectNames.forEach(coordProject => {
      const hasMatch = allProjectNames.includes(coordProject);
      console.log(`"${coordProject}" exists in surveys: ${hasMatch}`);
    });

  } catch (error) {
    console.error('Error checking coordinator surveys:', error);
  } finally {
    await sequelize.close();
  }
}

checkCoordinatorSurveys(); 