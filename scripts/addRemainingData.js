const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/hierarchical-data';

async function addRemainingData() {
  console.log('Adding remaining missing data...');
  
  try {
    // 1. Try to create Saudi MU
    console.log('\n1. Creating Saudi MU...');
    try {
      const saudiResponse = await axios.post(`${API_BASE_URL}/mus`, {
        name: 'Saudi',
        code: 'SAU'
      });
      console.log('✓ Created Saudi MU:', saudiResponse.data.data);
      
      // 2. Create Saudi Arabia country for Saudi MU
      console.log('\n2. Creating Saudi Arabia country for Saudi MU...');
      const saudiCountryResponse = await axios.post(`${API_BASE_URL}/countries`, {
        name: 'Saudi Arabia',
        code: 'SA',
        mu_id: saudiResponse.data.data.id
      });
      console.log('✓ Created Saudi Arabia country:', saudiCountryResponse.data.data);
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✓ Saudi MU already exists');
        // Get existing Saudi MU
        const musResponse = await axios.get(`${API_BASE_URL}/mus`);
        const saudiMU = musResponse.data.find(m => m.name === 'Saudi');
        if (saudiMU) {
          console.log('Found existing Saudi MU with ID:', saudiMU.id);
        }
      } else {
        console.error('✗ Error creating Saudi MU:', error.response?.data?.message || error.message);
      }
    }
    
    // 3. Try to create Iran country for ME MU
    console.log('\n3. Creating Iran country for ME MU...');
    try {
      // Get ME MU
      const musResponse = await axios.get(`${API_BASE_URL}/mus`);
      const meMU = musResponse.data.find(m => m.name === 'ME');
      
      if (meMU) {
        const iranResponse = await axios.post(`${API_BASE_URL}/countries`, {
          name: 'Iran',
          code: 'IR',
          mu_id: meMU.id
        });
        console.log('✓ Created Iran country:', iranResponse.data.data);
      } else {
        console.error('✗ ME MU not found');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✓ Iran country already exists');
      } else {
        console.error('✗ Error creating Iran country:', error.response?.data?.message || error.message);
      }
    }
    
    // 4. Final verification
    console.log('\n4. Final verification...');
    const finalMusResponse = await axios.get(`${API_BASE_URL}/mus`);
    console.log(`Total MUs: ${finalMusResponse.data.length}`);
    
    for (const mu of finalMusResponse.data) {
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries/${mu.id}`);
      console.log(`${mu.name}: ${countriesResponse.data.length} countries`);
    }
    
  } catch (error) {
    console.error('Error in addRemainingData:', error.message);
  }
}

// Run the script
addRemainingData().then(() => {
  console.log('\nScript completed!');
}).catch(console.error); 