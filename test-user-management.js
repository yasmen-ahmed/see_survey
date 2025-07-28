const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testUserManagement() {
  try {
    console.log('🧪 Testing User Management System...\n');

    // 1. Test getting all roles
    console.log('1. Testing GET /user-management/roles');
    const rolesResponse = await axios.get(`${BASE_URL}/user-management/roles`);
    console.log('✅ Roles retrieved successfully');
    console.log(`   Found ${rolesResponse.data.data.length} roles\n`);

    // 2. Test getting all projects
    console.log('2. Testing GET /user-management/projects');
    const projectsResponse = await axios.get(`${BASE_URL}/user-management/projects`);
    console.log('✅ Projects retrieved successfully');
    console.log(`   Found ${projectsResponse.data.data.length} projects\n`);

    // 3. Test getting all users
    console.log('3. Testing GET /user-management/users');
    const usersResponse = await axios.get(`${BASE_URL}/user-management/users`);
    console.log('✅ Users retrieved successfully');
    console.log(`   Found ${usersResponse.data.data.length} users\n`);

    console.log('🎉 All tests passed! User management system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testUserManagement(); 