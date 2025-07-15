const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/hierarchical-data';

async function testAPIError() {
  console.log('Testing API error details...');
  
  try {
    // Test creating Saudi MU with detailed error logging
    console.log('\n1. Testing Saudi MU creation...');
    try {
      const response = await axios.post(`${API_BASE_URL}/mus`, {
        name: 'Saudi',
        code: 'SAU'
      });
      console.log('✓ Success:', response.data);
    } catch (error) {
      console.log('✗ Error Status:', error.response?.status);
      console.log('✗ Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.log('✗ Error Message:', error.message);
    }
    
    // Test creating Iran country with detailed error logging
    console.log('\n2. Testing Iran country creation...');
    try {
      // Get ME MU first
      const musResponse = await axios.get(`${API_BASE_URL}/mus`);
      const meMU = musResponse.data.find(m => m.name === 'ME');
      console.log('ME MU found:', meMU);
      
      if (meMU) {
        const response = await axios.post(`${API_BASE_URL}/countries`, {
          name: 'Iran',
          code: 'IR',
          mu_id: meMU.id
        });
        console.log('✓ Success:', response.data);
      }
    } catch (error) {
      console.log('✗ Error Status:', error.response?.status);
      console.log('✗ Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.log('✗ Error Message:', error.message);
    }
    
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testAPIError().then(() => {
  console.log('\nTest completed!');
}).catch(console.error); 