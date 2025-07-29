const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔧 Testing login with user coordinator.role...');

    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      login: 'coordinator.role',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('User data:', loginResponse.data.user);
    console.log('Role:', loginResponse.data.user.role);
    console.log('All roles:', loginResponse.data.user.roles);

  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin(); 