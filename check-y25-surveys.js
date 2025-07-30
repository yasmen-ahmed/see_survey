const Survey = require('./models/Survey');
const sequelize = require('./config/database');

async function checkY25Surveys() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check for surveys with "Y25 FDD & TDD Upgrade 2025-26" project
    const y25Surveys = await Survey.findAll({
      where: { project: 'Y25 FDD & TDD Upgrade 2025-26' }
    });

    console.log(`\nSurveys found for "Y25 FDD & TDD Upgrade 2025-26": ${y25Surveys.length}`);
    
    if (y25Surveys.length > 0) {
      console.log('\nSurvey details:');
      y25Surveys.forEach((survey, index) => {
        console.log(`${index + 1}. Session ID: ${survey.session_id}`);
        console.log(`   Project: "${survey.project}"`);
        console.log(`   User ID: ${survey.user_id}`);
        console.log(`   Creator ID: ${survey.creator_id}`);
        console.log(`   Status: ${survey.TSSR_Status}`);
        console.log(`   Site ID: ${survey.site_id}`);
        console.log('');
      });
    } else {
      console.log('No surveys found for "Y25 FDD & TDD Upgrade 2025-26" project.');
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
      const count = allSurveys.filter(s => s.project === project).length;
      console.log(`- "${project}" (${count} surveys)`);
    });

    // Check for any Y25 projects
    const y25Projects = allProjectNames.filter(name => name.includes('Y25'));
    console.log('\nY25 projects found:');
    y25Projects.forEach(project => {
      const count = allSurveys.filter(s => s.project === project).length;
      console.log(`- "${project}" (${count} surveys)`);
    });

  } catch (error) {
    console.error('Error checking Y25 surveys:', error);
  } finally {
    await sequelize.close();
  }
}

checkY25Surveys(); 