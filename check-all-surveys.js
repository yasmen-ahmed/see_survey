const Survey = require('./models/Survey');
const User = require('./models/User');
const sequelize = require('./config/database');

async function checkAllSurveys() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Get all surveys with project names
    const surveys = await Survey.findAll({
      where: {
        project: {
          [require('sequelize').Op.ne]: null,
          [require('sequelize').Op.ne]: ''
        }
      },
      order: [['created_at', 'DESC']]
    });

    console.log(`\nTotal surveys with projects: ${surveys.length}`);
    
    if (surveys.length > 0) {
      console.log('\nAll surveys with projects:');
      surveys.forEach((survey, index) => {
        console.log(`${index + 1}. Session ID: ${survey.session_id}`);
        console.log(`   Project: "${survey.project}"`);
        console.log(`   User ID: ${survey.user_id}`);
        console.log(`   Creator ID: ${survey.creator_id}`);
        console.log(`   Status: ${survey.TSSR_Status}`);
        console.log(`   Created At: ${survey.created_at}`);
        console.log('');
      });
    }

    // Get unique project names
    const projectNames = [...new Set(surveys.map(s => s.project))];
    console.log('\nUnique project names:');
    projectNames.forEach(project => {
      const count = surveys.filter(s => s.project === project).length;
      console.log(`- "${project}" (${count} surveys)`);
    });

    // Check for the specific survey from the image
    const specificSurvey = await Survey.findOne({
      where: { session_id: '2025-07-29T13:17:58.916Zassigntoyasmen' }
    });

    if (specificSurvey) {
      console.log('\nFound the survey from the image:');
      console.log('Session ID:', specificSurvey.session_id);
      console.log('Project:', specificSurvey.project);
      console.log('User ID:', specificSurvey.user_id);
      console.log('Creator ID:', specificSurvey.creator_id);
      console.log('Status:', specificSurvey.TSSR_Status);
    } else {
      console.log('\nSurvey from image not found in database');
    }

  } catch (error) {
    console.error('Error checking surveys:', error);
  } finally {
    await sequelize.close();
  }
}

checkAllSurveys(); 