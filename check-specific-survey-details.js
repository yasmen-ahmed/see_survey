const Survey = require('./models/Survey');
const User = require('./models/User');
const sequelize = require('./config/database');

async function checkSpecificSurvey() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Find the specific survey
    const survey = await Survey.findOne({
      where: { session_id: '2025-07-29T13:17:58.916Zassigntoyasmen' }
    });

    if (survey) {
      console.log('\n=== Survey Details ===');
      console.log('Session ID:', survey.session_id);
      console.log('Project:', survey.project);
      console.log('User ID:', survey.user_id);
      console.log('Creator ID:', survey.creator_id);
      console.log('Status:', survey.TSSR_Status);
      console.log('Created At:', survey.created_at);
      console.log('Updated At:', survey.updated_at);
      
      // Get creator details
      const creator = await User.findByPk(survey.creator_id);
      if (creator) {
        console.log('Creator:', creator.username);
      }
      
      // Get assigned user details
      const assignedUser = await User.findByPk(survey.user_id);
      if (assignedUser) {
        console.log('Assigned To:', assignedUser.username);
      }
      
      console.log('\n=== Raw Data ===');
      console.log(JSON.stringify(survey.toJSON(), null, 2));
      
    } else {
      console.log('Survey not found in database');
    }

    // Check all surveys with empty project names
    const emptyProjectSurveys = await Survey.findAll({
      where: {
        project: {
          [require('sequelize').Op.or]: [null, '']
        }
      }
    });

    console.log(`\n=== Surveys with Empty Project Names (${emptyProjectSurveys.length}) ===`);
    emptyProjectSurveys.forEach((s, index) => {
      console.log(`${index + 1}. Session ID: ${s.session_id}`);
      console.log(`   Project: "${s.project}"`);
      console.log(`   Creator ID: ${s.creator_id}`);
      console.log(`   User ID: ${s.user_id}`);
      console.log(`   Status: ${s.TSSR_Status}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error checking survey:', error);
  } finally {
    await sequelize.close();
  }
}

checkSpecificSurvey(); 