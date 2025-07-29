const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data for different user roles
const testUsers = {
  admin: {
    username: 'admin.user',
    email: 'admin@example.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    NID: '123456789',
    phone: '+1234567890',
    title: 'Administrator'
  },
  coordinator: {
    username: 'coordinator.user',
    email: 'coordinator@example.com',
    password: 'password123',
    firstName: 'Coordinator',
    lastName: 'User',
    NID: '123456790',
    phone: '+1234567891',
    title: 'Project Coordinator'
  },
  surveyEngineer: {
    username: 'engineer.user',
    email: 'engineer@example.com',
    password: 'password123',
    firstName: 'Survey',
    lastName: 'Engineer',
    NID: '123456791',
    phone: '+1234567892',
    title: 'Survey Engineer'
  },
  approver: {
    username: 'approver.user',
    email: 'approver@example.com',
    password: 'password123',
    firstName: 'Approver',
    lastName: 'User',
    NID: '123456792',
    phone: '+1234567893',
    title: 'Approver'
  }
};

async function testStatusPermissions() {
  try {
    console.log('🧪 Testing Role-Based Status Change Permissions...\n');

    // 1. Create test users
    console.log('1. Creating test users...');
    const users = {};
    
    for (const [role, userData] of Object.entries(testUsers)) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/register`, userData);
        users[role] = {
          ...response.data.user,
          token: response.data.token
        };
        console.log(`   ✅ Created ${role} user: ${userData.username}`);
      } catch (error) {
        console.log(`   ⚠️  ${role} user might already exist: ${userData.username}`);
      }
    }

    // 2. Assign roles to users
    console.log('\n2. Assigning roles to users...');
    
    const roleAssignments = [
      { userId: users.admin?.id, roleId: 2 }, // Admin role
      { userId: users.coordinator?.id, roleId: 3 }, // Coordinator role
      { userId: users.surveyEngineer?.id, roleId: 4 }, // Survey Engineer role
      { userId: users.approver?.id, roleId: 5 } // Approver role
    ];

    for (const assignment of roleAssignments) {
      if (assignment.userId) {
        try {
          await axios.post(`${BASE_URL}/user-management/users/${assignment.userId}/roles`, {
            roleId: assignment.roleId,
            assignedBy: 1 // Assuming user ID 1 is a super admin
          });
          console.log(`   ✅ Assigned role to user ${assignment.userId}`);
        } catch (error) {
          console.log(`   ⚠️  Role assignment failed for user ${assignment.userId}`);
        }
      }
    }

    // 3. Create a test survey
    console.log('\n3. Creating test survey...');
    const surveyData = {
      site_id: 'TEST_SITE_001',
      user_id: users.surveyEngineer?.id || 1,
      country: 'Test Country',
      ct: 'Test CT',
      project: 'Test Project',
      company: 'Test Company'
    };

    let survey;
    try {
      const response = await axios.post(`${BASE_URL}/surveys`, surveyData, {
        headers: { Authorization: `Bearer ${users.admin?.token || users.coordinator?.token}` }
      });
      survey = response.data;
      console.log(`   ✅ Created survey: ${survey.session_id}`);
    } catch (error) {
      console.log(`   ❌ Failed to create survey: ${error.response?.data?.error || error.message}`);
      return;
    }

    // 4. Test status changes based on roles
    console.log('\n4. Testing status change permissions...\n');

    const statusTests = [
      {
        role: 'surveyEngineer',
        fromStatus: 'created',
        toStatus: 'submitted',
        shouldWork: true,
        description: 'Survey Engineer: Created → Submitted'
      },
      {
        role: 'approver',
        fromStatus: 'submitted',
        toStatus: 'review',
        shouldWork: true,
        description: 'Approver: Submitted → Under Revision'
      },
      {
        role: 'approver',
        fromStatus: 'review',
        toStatus: 'rework',
        shouldWork: true,
        description: 'Approver: Under Revision → Rework'
      },
      {
        role: 'approver',
        fromStatus: 'review',
        toStatus: 'done',
        shouldWork: true,
        description: 'Approver: Under Revision → Approved'
      },
      {
        role: 'surveyEngineer',
        fromStatus: 'submitted',
        toStatus: 'review',
        shouldWork: false,
        description: 'Survey Engineer: Submitted → Under Revision (should fail)'
      }
    ];

    for (const test of statusTests) {
      const user = users[test.role];
      if (!user) {
        console.log(`   ⚠️  Skipping test: ${test.description} (user not found)`);
        continue;
      }

      try {
        // First, set the current status
        await axios.put(`${BASE_URL}/surveys/${survey.session_id}/status`, {
          TSSR_Status: test.fromStatus
        }, {
          headers: { Authorization: `Bearer ${users.admin?.token}` }
        });

        // Then test the status change
        const response = await axios.put(`${BASE_URL}/surveys/${survey.session_id}/status`, {
          TSSR_Status: test.toStatus
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        if (test.shouldWork) {
          console.log(`   ✅ ${test.description}: SUCCESS`);
        } else {
          console.log(`   ❌ ${test.description}: Should have failed but succeeded`);
        }
      } catch (error) {
        if (test.shouldWork) {
          console.log(`   ❌ ${test.description}: FAILED - ${error.response?.data?.error || error.message}`);
        } else {
          console.log(`   ✅ ${test.description}: Correctly blocked - ${error.response?.data?.error || error.message}`);
        }
      }
    }

    console.log('\n🎉 Status permission tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testStatusPermissions(); 