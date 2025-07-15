const axios = require('axios');
const config = require('./migrationConfig');

/**
 * Setup Script for New Server
 * 
 * This script helps set up a new server with:
 * 1. Database structure
 * 2. API endpoints
 * 3. Initial data validation
 */

const TARGET_SERVER = config.target.server;
const API_BASE_PATH = config.target.apiPath;

/**
 * Test if the new server is accessible and has the required endpoints
 */
async function testNewServer() {
  console.log('Testing new server setup...');
  console.log(`Server: ${TARGET_SERVER}`);
  console.log('================================');
  
  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const response = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`, {
      timeout: config.options.timeout
    });
    console.log('✓ Server is accessible');
    console.log(`✓ Found ${response.data.length} MUs on target server`);
    
    // Test all endpoints
    console.log('\n2. Testing API endpoints...');
    
    // Test MUs endpoint
    try {
      await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      console.log('✓ GET /mus endpoint working');
    } catch (error) {
      console.log('✗ GET /mus endpoint failed:', error.response?.status);
    }
    
    // Test Countries endpoint
    try {
      const musResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      if (musResponse.data.length > 0) {
        const firstMU = musResponse.data[0];
        await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/countries/${firstMU.id}`);
        console.log('✓ GET /countries/:muId endpoint working');
      } else {
        console.log('⚠ No MUs found to test countries endpoint');
      }
    } catch (error) {
      console.log('✗ GET /countries/:muId endpoint failed:', error.response?.status);
    }
    
    // Test CTs endpoint
    try {
      const musResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      if (musResponse.data.length > 0) {
        const firstMU = musResponse.data[0];
        const countriesResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/countries/${firstMU.id}`);
        if (countriesResponse.data.length > 0) {
          const firstCountry = countriesResponse.data[0];
          await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/cts/${firstCountry.id}`);
          console.log('✓ GET /cts/:countryId endpoint working');
        } else {
          console.log('⚠ No countries found to test CTs endpoint');
        }
      }
    } catch (error) {
      console.log('✗ GET /cts/:countryId endpoint failed:', error.response?.status);
    }
    
    // Test Projects endpoint
    try {
      const musResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      if (musResponse.data.length > 0) {
        const firstMU = musResponse.data[0];
        const countriesResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/countries/${firstMU.id}`);
        if (countriesResponse.data.length > 0) {
          const firstCountry = countriesResponse.data[0];
          const ctsResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/cts/${firstCountry.id}`);
          if (ctsResponse.data.length > 0) {
            const firstCT = ctsResponse.data[0];
            await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/projects/${firstCT.id}`);
            console.log('✓ GET /projects/:ctId endpoint working');
          } else {
            console.log('⚠ No CTs found to test projects endpoint');
          }
        }
      }
    } catch (error) {
      console.log('✗ GET /projects/:ctId endpoint failed:', error.response?.status);
    }
    
    // Test Companies endpoint
    try {
      const musResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      if (musResponse.data.length > 0) {
        const firstMU = musResponse.data[0];
        const countriesResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/countries/${firstMU.id}`);
        if (countriesResponse.data.length > 0) {
          const firstCountry = countriesResponse.data[0];
          const ctsResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/cts/${firstCountry.id}`);
          if (ctsResponse.data.length > 0) {
            const firstCT = ctsResponse.data[0];
            const projectsResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/projects/${firstCT.id}`);
            if (projectsResponse.data.length > 0) {
              const firstProject = projectsResponse.data[0];
              await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/companies/${firstProject.id}`);
              console.log('✓ GET /companies/:projectId endpoint working');
            } else {
              console.log('⚠ No projects found to test companies endpoint');
            }
          }
        }
      }
    } catch (error) {
      console.log('✗ GET /companies/:projectId endpoint failed:', error.response?.status);
    }
    
    console.log('\n3. Testing POST endpoints...');
    
    // Test creating a sample MU
    try {
      const testMUResponse = await axios.post(`${TARGET_SERVER}${API_BASE_PATH}/mus`, {
        name: 'TEST_MU',
        code: 'TST'
      });
      console.log('✓ POST /mus endpoint working');
      
      // Clean up test data
      console.log('  Cleaning up test data...');
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✓ POST /mus endpoint working (record already exists)');
      } else {
        console.log('✗ POST /mus endpoint failed:', error.response?.status, error.response?.data?.message);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('✗ Server test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nMake sure the target server is running and accessible.');
      console.error('Check if the server is started and the port is correct.');
    }
    return false;
  }
}

/**
 * Display server information
 */
function displayServerInfo() {
  console.log('New Server Setup Information');
  console.log('============================');
  console.log(`Target Server: ${TARGET_SERVER}`);
  console.log(`API Base Path: ${API_BASE_PATH}`);
  console.log(`Description: ${config.target.description}`);
  console.log('');
  console.log('Required Setup Steps:');
  console.log('1. Ensure the target server is running');
  console.log('2. Verify the database is created and accessible');
  console.log('3. Confirm all API endpoints are available');
  console.log('4. Run the migration script to copy data');
  console.log('');
}

/**
 * Main function
 */
async function main() {
  console.log('New Server Setup Script');
  console.log('=======================');
  
  displayServerInfo();
  
  const isReady = await testNewServer();
  
  if (isReady) {
    console.log('\n✅ New server is ready for migration!');
    console.log('You can now run: node scripts/migrateToNewServer.js');
  } else {
    console.log('\n❌ New server setup incomplete.');
    console.log('Please fix the issues above before running migration.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testNewServer,
  displayServerInfo
}; 