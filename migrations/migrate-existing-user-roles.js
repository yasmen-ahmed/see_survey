'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if the 'role' column exists in the users table
      const tableDescription = await queryInterface.describeTable('users');
      
      if (!tableDescription.role) {
        console.log('Role column does not exist in users table, skipping migration');
        return;
      }

      // Get all existing users with their roles
      const users = await queryInterface.sequelize.query(
        'SELECT id, role FROM users WHERE role IS NOT NULL',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Get role IDs
      const roles = await queryInterface.sequelize.query(
        'SELECT id, name FROM roles',
        { type: Sequelize.QueryTypes.SELECT }
      );

      const roleMap = {};
      roles.forEach(role => {
        roleMap[role.name] = role.id;
      });

      // Migrate existing user roles to user_roles table
      const userRoles = [];
      for (const user of users) {
        const roleId = roleMap[user.role];
        if (roleId) {
          userRoles.push({
            user_id: user.id,
            role_id: roleId,
            assigned_by: null, // We don't have this information for existing users
            assigned_at: new Date(),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      if (userRoles.length > 0) {
        await queryInterface.bulkInsert('user_roles', userRoles, {});
      }
    } catch (error) {
      console.log('Error in migrate-existing-user-roles migration:', error.message);
      console.log('Skipping this migration as it may not be applicable');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all user roles (this will be handled by the remove-role-from-users migration rollback)
    await queryInterface.bulkDelete('user_roles', {}, {});
  }
}; 