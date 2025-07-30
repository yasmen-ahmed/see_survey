const Survey = require('./models/Survey');
const User = require('./models/User');
const sequelize = require('./config/database');

async function checkSurveys() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Get all surveys
    const surveys = await Survey.findAll();

    console.log(`\nTotal surveys found: ${surveys.length}`);
    
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
      console.log('No surveys found in database.');
    }

    // Check specific project names
    const projectNames = surveys.map(s => s.project).filter(Boolean);
    const uniqueProjects = [...new Set(projectNames)];
    
    console.log('Unique project names in surveys:');
    uniqueProjects.forEach(project => {
      console.log(`- "${project}"`);
    });

    // Check if our test project exists
    const testProject = 'New Project';
    const hasTestProject = uniqueProjects.includes(testProject);
    console.log(`\nDoes "${testProject}" exist in surveys? ${hasTestProject}`);

  } catch (error) {
    console.error('Error checking surveys:', error);
  } finally {
    await sequelize.close();
  }
}

checkSurveys(); 