'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the role column from users table
    await queryInterface.removeColumn('users', 'role');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the role column if migration is rolled back
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'engineer'),
      defaultValue: 'engineer',
      allowNull: false
    });
  }
}; 