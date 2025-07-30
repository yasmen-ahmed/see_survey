const axios = require('axios');

async function testRemoveAllSurveys() {
  try {
    console.log('Testing Remove All Surveys API...\n');

    // First, let's check how many surveys exist before deletion
    console.log('=== Checking surveys before deletion ===');
    try {
      const beforeResponse = await axios.get('http://localhost:3000/api/surveys/role/admin');
      console.log('Surveys before deletion:', beforeResponse.data.length);
    } catch (error) {
      console.error('Error checking surveys before deletion:', error.response?.data || error.message);
    }

    // Test the remove all surveys endpoint
    console.log('\n=== Testing Remove All Surveys ===');
    try {
      const deleteResponse = await axios.delete('http://localhost:3000/api/surveys/all');
      console.log('Delete response:', deleteResponse.data);
    } catch (error) {
      console.error('Error deleting all surveys:', error.response?.data || error.message);
    }

    // Check how many surveys exist after deletion
    console.log('\n=== Checking surveys after deletion ===');
    try {
      const afterResponse = await axios.get('http://localhost:3000/api/surveys/role/admin');
      console.log('Surveys after deletion:', afterResponse.data.length);
    } catch (error) {
      console.error('Error checking surveys after deletion:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('General error:', error.message);
  }
}

testRemoveAllSurveys(); 