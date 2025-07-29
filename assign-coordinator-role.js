const axios = require('axios');

async function assignCoordinatorRole() {
  try {
    console.log('🔧 Assigning Coordinator role to user...');

    // First, let's get all users
    const usersResponse = await axios.get('http://localhost:3000/api/user-management/users');
    console.log('Available users:', usersResponse.data.data.map(u => ({ id: u.id, username: u.username })));

    // Get all roles
    const rolesResponse = await axios.get('http://localhost:3000/api/user-management/roles');
    const coordinatorRole = rolesResponse.data.data.find(role => role.name === 'coordinator');
    
    if (!coordinatorRole) {
      console.log('❌ Coordinator role not found');
      return;
    }

    console.log('Found coordinator role:', coordinatorRole.id);

    // Assign coordinator role to user ID 1 (or you can change this)
    const userId = 1; // Change this to your user ID
    const roleId = coordinatorRole.id;

    const assignResponse = await axios.post(`http://localhost:3000/api/user-management/users/${userId}/roles`, {
      roleId: roleId,
      assignedBy: 1
    });

    console.log('✅ Coordinator role assigned successfully!');
    console.log('Response:', assignResponse.data);

    // Verify the assignment
    const userRolesResponse = await axios.get(`http://localhost:3000/api/user-management/users/${userId}/roles`);
    console.log('User roles after assignment:', userRolesResponse.data.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

assignCoordinatorRole(); 