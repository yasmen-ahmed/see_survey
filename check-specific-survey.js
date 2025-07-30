const Survey = require('./models/Survey');
const sequelize = require('./config/database');

async function checkSpecificSurvey() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Find survey with "New Project"
    const survey = await Survey.findOne({
      where: { project: 'New Project' }
    });

    if (survey) {
      console.log('Found survey with "New Project":');
      console.log('Session ID:', survey.session_id);
      console.log('Project:', survey.project);
      console.log('User ID:', survey.user_id);
      console.log('Creator ID:', survey.creator_id);
      console.log('Status:', survey.TSSR_Status);
      console.log('Created At:', survey.created_at);
    } else {
      console.log('No survey found with "New Project"');
    }

    // Check all surveys with non-empty projects
    const surveysWithProjects = await Survey.findAll({
      where: {
        project: {
          [require('sequelize').Op.ne]: null,
          [require('sequelize').Op.ne]: ''
        }
      }
    });

    console.log('\nAll surveys with non-empty projects:');
    surveysWithProjects.forEach((s, index) => {
      console.log(`${index + 1}. Session ID: ${s.session_id}`);
      console.log(`   Project: "${s.project}"`);
      console.log(`   User ID: ${s.user_id}`);
      console.log(`   Creator ID: ${s.creator_id}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error checking specific survey:', error);
  } finally {
    await sequelize.close();
  }
}

checkSpecificSurvey(); 