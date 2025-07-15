const axios = require('axios');
const config = require('./migrationConfig');

const TARGET_SERVER = config.target.server;

/**
 * Check server status and diagnose issues
 */
async function checkServerStatus() {
  console.log('Server Status Check');
  console.log('==================');
  console.log(`Target Server: ${TARGET_SERVER}`);
  console.log('');
  
  try {
    // 1. Test basic server connectivity (without API path)
    console.log('1. Testing basic server connectivity...');
    try {
      const baseResponse = await axios.get(TARGET_SERVER, { timeout: 5000 });
      console.log('✓ Server is running');
      console.log(`  Status: ${baseResponse.status}`);
      console.log(`  Response: ${baseResponse.data ? 'Has content' : 'No content'}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('✗ Server is not running or not accessible');
        console.log('  - Check if the server is started');
        console.log('  - Check if the port 3000 is correct');
        console.log('  - Check firewall settings');
        return;
      } else {
        console.log(`⚠ Server responded with error: ${error.message}`);
      }
    }
    
    // 2. Test different API paths
    console.log('\n2. Testing different API paths...');
    
    const apiPaths = [
      '/api/hierarchical-data/mus',
      '/api/hierarchical/mus',
      '/api/mus',
      '/mus',
      '/api/hierarchical-data',
      '/api'
    ];
    
    for (const path of apiPaths) {
      try {
        console.log(`  Testing: ${TARGET_SERVER}${path}`);
        const response = await axios.get(`${TARGET_SERVER}${path}`, { timeout: 5000 });
        console.log(`  ✓ SUCCESS: ${path} (Status: ${response.status})`);
        console.log(`    Found ${response.data?.length || 0} items`);
        break;
      } catch (error) {
        if (error.response) {
          console.log(`  ✗ ${path}: ${error.response.status} - ${error.response.statusText}`);
        } else {
          console.log(`  ✗ ${path}: ${error.message}`);
        }
      }
    }
    
    // 3. Test server info endpoints
    console.log('\n3. Testing common server info endpoints...');
    
    const infoPaths = [
      '/',
      '/health',
      '/status',
      '/api/health',
      '/api/status'
    ];
    
    for (const path of infoPaths) {
      try {
        const response = await axios.get(`${TARGET_SERVER}${path}`, { timeout: 5000 });
        console.log(`  ✓ ${path}: ${response.status} - ${typeof response.data}`);
        if (response.data && typeof response.data === 'object') {
          console.log(`    Info: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`  ✗ ${path}: ${error.response?.status || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error during server check:', error.message);
  }
}

/**
 * Provide solutions based on findings
 */
function provideSolutions() {
  console.log('\n==========================================');
  console.log('SOLUTIONS BASED ON FINDINGS');
  console.log('==========================================');
  console.log('');
  console.log('If server is not running:');
  console.log('1. Start the backend server on the target machine');
  console.log('2. Ensure it\'s running on port 3000');
  console.log('3. Check if the server is accessible from your machine');
  console.log('');
  console.log('If server is running but API endpoints are missing:');
  console.log('1. Deploy the same backend code to the target server');
  console.log('2. Ensure the hierarchical routes are registered');
  console.log('3. Check if the database is properly configured');
  console.log('');
  console.log('If API path is different:');
  console.log('1. Update the API path in migrationConfig.js');
  console.log('2. Verify the correct endpoint structure');
  console.log('');
  console.log('If network connectivity issues:');
  console.log('1. Check firewall settings');
  console.log('2. Verify IP address and port');
  console.log('3. Test with ping or telnet');
  console.log('');
}

// Main execution
async function main() {
  await checkServerStatus();
  provideSolutions();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkServerStatus }; 