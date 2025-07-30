const axios = require('axios');

async function testCoordinatorEndpoint() {
  try {
    console.log('Testing coordinator endpoint...');
    
    // First, get a token by logging in as coordinator
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      login: 'coordinator.role',
      password: 'password123' // You might need to adjust this password
    });

    const token = loginResponse.data.token;
    console.log('Got token for coordinator');

    // Test the coordinator projects endpoint
    const projectsResponse = await axios.get('http://localhost:3000/api/surveys/test-coordinator-projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Coordinator projects test response:', JSON.stringify(projectsResponse.data, null, 2));

    // Test the main surveys endpoint
    const surveysResponse = await axios.get('http://localhost:3000/api/surveys', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Main surveys response count:', surveysResponse.data.length);
    console.log('Surveys:', surveysResponse.data.map(s => ({
      session_id: s.session_id,
      project: s.project,
      user_id: s.user_id,
      creator_id: s.creator_id
    })));

  } catch (error) {
    console.error('Error testing coordinator endpoint:', error.response?.data || error.message);
  }
}

testCoordinatorEndpoint(); 