const axios = require('axios');

async function testRoleAPI() {
  try {
    console.log('Testing role-based API endpoints...\n');

    // Test 1: Admin role (should show all surveys)
    console.log('=== Testing Admin Role ===');
    try {
      const adminResponse = await axios.get('http://localhost:3000/api/surveys/role/admin');
      console.log('Admin surveys count:', adminResponse.data.length);
      console.log('Admin surveys:', adminResponse.data.map(s => ({
        session_id: s.session_id,
        project: s.project,
        user_id: s.user_id,
        creator_id: s.creator_id
      })));
    } catch (error) {
      console.error('Admin test error:', error.response?.data || error.message);
    }

    console.log('\n=== Testing Coordinator Role ===');
    // Test 2: Coordinator role (userId 3 - coordinator.role)
    try {
      const coordinatorResponse = await axios.get('http://localhost:3000/api/surveys/role/coordinator?userId=3');
      console.log('Coordinator surveys count:', coordinatorResponse.data.length);
      console.log('Coordinator surveys:', coordinatorResponse.data.map(s => ({
        session_id: s.session_id,
        project: s.project,
        user_id: s.user_id,
        creator_id: s.creator_id
      })));
    } catch (error) {
      console.error('Coordinator test error:', error.response?.data || error.message);
    }

    console.log('\n=== Testing Survey Engineer Role ===');
    // Test 3: Survey Engineer role (userId 4 - siteengineer.role)
    try {
      const engineerResponse = await axios.get('http://localhost:3000/api/surveys/role/survey_engineer?userId=4');
      console.log('Survey Engineer surveys count:', engineerResponse.data.length);
      console.log('Survey Engineer surveys:', engineerResponse.data.map(s => ({
        session_id: s.session_id,
        project: s.project,
        user_id: s.user_id,
        creator_id: s.creator_id
      })));
    } catch (error) {
      console.error('Survey Engineer test error:', error.response?.data || error.message);
    }

    console.log('\n=== Testing Approver Role ===');
    // Test 4: Approver role
    try {
      const approverResponse = await axios.get('http://localhost:3000/api/surveys/role/approver');
      console.log('Approver surveys count:', approverResponse.data.length);
      console.log('Approver surveys:', approverResponse.data.map(s => ({
        session_id: s.session_id,
        project: s.project,
        status: s.TSSR_Status
      })));
    } catch (error) {
      console.error('Approver test error:', error.response?.data || error.message);
    }

    console.log('\n=== Testing Invalid Role ===');
    // Test 5: Invalid role
    try {
      const invalidResponse = await axios.get('http://localhost:3000/api/surveys/role/invalid');
      console.log('Invalid role response:', invalidResponse.data);
    } catch (error) {
      console.log('Invalid role error (expected):', error.response?.data || error.message);
    }

    console.log('\n=== Testing Missing UserId ===');
    // Test 6: Missing userId for coordinator
    try {
      const missingUserIdResponse = await axios.get('http://localhost:3000/api/surveys/role/coordinator');
      console.log('Missing userId response:', missingUserIdResponse.data);
    } catch (error) {
      console.log('Missing userId error (expected):', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('General error:', error.message);
  }
}

testRoleAPI(); 