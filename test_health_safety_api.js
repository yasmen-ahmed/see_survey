const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_SESSION_ID = 'test-health-safety-session-456';

// Test data
const siteAccessTestData = {
  access_road_safe_condition: 'Yes',
  site_access_safe_secure: 'Yes', 
  safe_usage_access_ensured: 'No',
  site_safe_environmental_influence: 'Yes',
  permanent_fence_correctly_installed: 'Not applicable',
  access_egress_equipment_safe: 'Yes',
  designated_walkway_routes_tripping: 'No',
  designated_walkway_routes_radiation: 'Yes',
  emergency_exits_clearly_visible: 'Yes',
  vehicles_good_condition_nsn_rules: 'Not applicable',
  rubbish_unused_material_removed: 'Yes',
  safe_manual_handling_practices: 'Yes',
  ladder_length_adequate: 'No',
  special_permits_required: 'Not applicable',
  ladders_good_condition: 'Yes'
};

const btsAccessTestData = {
  safety_climbing_system_correctly_installed: 'Yes',
  walking_path_situated_safety_specifications: 'Yes',
  mw_antennas_height_exclusion_zone: 'No',
  non_authorized_access_antennas_prevented: 'Yes',
  bts_pole_access_lighting_sufficient: 'Not applicable',
  safe_access_bts_poles_granted: 'Yes',
  pathway_blocks_walking_grids_installed: 'No'
};

const siteAccessUpdateData = {
  access_road_safe_condition: 'No',
  emergency_exits_clearly_visible: 'Not applicable',
  ladders_good_condition: 'Yes'
};

const btsAccessUpdateData = {
  safety_climbing_system_correctly_installed: 'Not applicable',
  safe_access_bts_poles_granted: 'No'
};

// Test functions
async function testHealthSafetyAPIs() {
  console.log('🧪 Starting Health & Safety API Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Helper function to run a test
    const runTest = async (testName, testFunction) => {
      totalTests++;
      try {
        console.log(`${totalTests}. ${testName}...`);
        await testFunction();
        console.log(`   ✅ PASSED\n`);
        passedTests++;
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}\n`);
      }
    };

    // === HEALTH & SAFETY SITE ACCESS TESTS ===
    console.log('🏗️ === HEALTH & SAFETY SITE ACCESS TESTS ===\n');

    await runTest('Get Site Access (Empty State)', async () => {
      const response = await axios.get(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.has_data !== false) throw new Error('Expected has_data to be false for empty state');
      if (response.data.session_id !== TEST_SESSION_ID) throw new Error('Session ID mismatch');
    });

    await runTest('Create Site Access Data', async () => {
      const response = await axios.put(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`, siteAccessTestData);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (!response.data.message.includes('successfully')) throw new Error('Expected success message');
      if (!response.data.data) throw new Error('Expected data in response');
    });

    await runTest('Get Site Access (With Data)', async () => {
      const response = await axios.get(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.has_data !== true) throw new Error('Expected has_data to be true');
      if (response.data.access_road_safe_condition !== 'Yes') throw new Error('Data mismatch');
    });

    await runTest('Update Site Access Data (PUT)', async () => {
      const updatedData = { ...siteAccessTestData, access_road_safe_condition: 'No' };
      const response = await axios.put(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`, updatedData);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.data.access_road_safe_condition !== 'No') throw new Error('Update failed');
    });

    await runTest('Partial Update Site Access Data (PATCH)', async () => {
      const response = await axios.patch(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`, siteAccessUpdateData);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.data.emergency_exits_clearly_visible !== 'Not applicable') throw new Error('Partial update failed');
    });

    await runTest('Validate Site Access Enum Values', async () => {
      try {
        const invalidData = { access_road_safe_condition: 'Invalid Value' };
        await axios.put(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`, invalidData);
        throw new Error('Should have failed with invalid enum value');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior
        } else {
          throw new Error('Expected 400 validation error');
        }
      }
    });

    // === HEALTH & SAFETY BTS ACCESS TESTS ===
    console.log('📡 === HEALTH & SAFETY BTS ACCESS TESTS ===\n');

    await runTest('Get BTS Access (Empty State)', async () => {
      const response = await axios.get(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.has_data !== false) throw new Error('Expected has_data to be false for empty state');
      if (response.data.session_id !== TEST_SESSION_ID) throw new Error('Session ID mismatch');
    });

    await runTest('Create BTS Access Data', async () => {
      const response = await axios.put(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`, btsAccessTestData);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (!response.data.message.includes('successfully')) throw new Error('Expected success message');
      if (!response.data.data) throw new Error('Expected data in response');
    });

    await runTest('Get BTS Access (With Data)', async () => {
      const response = await axios.get(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.has_data !== true) throw new Error('Expected has_data to be true');
      if (response.data.safety_climbing_system_correctly_installed !== 'Yes') throw new Error('Data mismatch');
    });

    await runTest('Update BTS Access Data (PUT)', async () => {
      const updatedData = { ...btsAccessTestData, safety_climbing_system_correctly_installed: 'No' };
      const response = await axios.put(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`, updatedData);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.data.safety_climbing_system_correctly_installed !== 'No') throw new Error('Update failed');
    });

    await runTest('Partial Update BTS Access Data (PATCH)', async () => {
      const response = await axios.patch(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`, btsAccessUpdateData);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.data.safe_access_bts_poles_granted !== 'No') throw new Error('Partial update failed');
    });

    await runTest('Validate BTS Access Enum Values', async () => {
      try {
        const invalidData = { safety_climbing_system_correctly_installed: 'Invalid Value' };
        await axios.put(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`, invalidData);
        throw new Error('Should have failed with invalid enum value');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior
        } else {
          throw new Error('Expected 400 validation error');
        }
      }
    });

    // === CLEANUP TESTS ===
    console.log('🧹 === CLEANUP TESTS ===\n');

    await runTest('Delete Site Access Data', async () => {
      const response = await axios.delete(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (!response.data.message.includes('deleted successfully')) throw new Error('Expected deletion success message');
    });

    await runTest('Delete BTS Access Data', async () => {
      const response = await axios.delete(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (!response.data.message.includes('deleted successfully')) throw new Error('Expected deletion success message');
    });

    await runTest('Verify Site Access Deletion', async () => {
      const response = await axios.get(`${BASE_URL}/api/health-safety-site-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.has_data !== false) throw new Error('Expected has_data to be false after deletion');
    });

    await runTest('Verify BTS Access Deletion', async () => {
      const response = await axios.get(`${BASE_URL}/api/health-safety-bts-access/${TEST_SESSION_ID}`);
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      if (response.data.has_data !== false) throw new Error('Expected has_data to be false after deletion');
    });

  } catch (error) {
    console.log(`\n❌ Test suite error: ${error.message}`);
  }

  // Final Results
  console.log('🎯 === TEST RESULTS ===');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Health & Safety APIs are working perfectly!');
    console.log('\n🚀 API Endpoints Available:');
    console.log('   📋 Site Access: /api/health-safety-site-access/:session_id');
    console.log('   📡 BTS Access: /api/health-safety-bts-access/:session_id');
    console.log('\n✨ Valid Values: "Yes", "No", "Not applicable"');
  } else {
    console.log('⚠️ Some tests failed. Please check the server and database setup.');
  }
}

// Helper function to display API usage examples
function displayUsageExamples() {
  console.log('\n📚 === API USAGE EXAMPLES ===\n');
  
  console.log('🔍 GET Site Access Data:');
  console.log(`   curl -X GET "${BASE_URL}/api/health-safety-site-access/your-session-id"`);
  
  console.log('\n✏️ CREATE/UPDATE Site Access Data:');
  console.log(`   curl -X PUT "${BASE_URL}/api/health-safety-site-access/your-session-id" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '${JSON.stringify(siteAccessTestData, null, 2)}'`);
  
  console.log('\n🔍 GET BTS Access Data:');
  console.log(`   curl -X GET "${BASE_URL}/api/health-safety-bts-access/your-session-id"`);
  
  console.log('\n✏️ CREATE/UPDATE BTS Access Data:');
  console.log(`   curl -X PUT "${BASE_URL}/api/health-safety-bts-access/your-session-id" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '${JSON.stringify(btsAccessTestData, null, 2)}'`);
  
  console.log('\n🔧 PARTIAL UPDATE (PATCH) Example:');
  console.log(`   curl -X PATCH "${BASE_URL}/api/health-safety-site-access/your-session-id" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '${JSON.stringify(siteAccessUpdateData, null, 2)}'`);
  
  console.log('\n🗑️ DELETE Data:');
  console.log(`   curl -X DELETE "${BASE_URL}/api/health-safety-site-access/your-session-id"`);
  console.log(`   curl -X DELETE "${BASE_URL}/api/health-safety-bts-access/your-session-id"`);
}

// Run the tests
if (require.main === module) {
  testHealthSafetyAPIs().then(() => {
    displayUsageExamples();
  });
}

module.exports = {
  testHealthSafetyAPIs,
  displayUsageExamples,
  siteAccessTestData,
  btsAccessTestData
}; 