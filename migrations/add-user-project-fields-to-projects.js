'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      try {
        await queryInterface.describeTable(tableName);
        const tableDescription = await queryInterface.describeTable(tableName);
        return tableDescription.hasOwnProperty(columnName);
      } catch (error) {
        return false;
      }
    };

    // Add missing fields to existing projects table
    if (!(await columnExists('projects', 'description'))) {
      await queryInterface.addColumn('projects', 'description', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!(await columnExists('projects', 'status'))) {
      await queryInterface.addColumn('projects', 'status', {
        type: Sequelize.STRING(20),
        defaultValue: 'active',
        allowNull: false
      });
    }

    if (!(await columnExists('projects', 'start_date'))) {
      await queryInterface.addColumn('projects', 'start_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!(await columnExists('projects', 'end_date'))) {
      await queryInterface.addColumn('projects', 'end_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!(await columnExists('projects', 'client'))) {
      await queryInterface.addColumn('projects', 'client', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!(await columnExists('projects', 'budget'))) {
      await queryInterface.addColumn('projects', 'budget', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      });
    }

    if (!(await columnExists('projects', 'is_active'))) {
      await queryInterface.addColumn('projects', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }

    // Add indexes for new fields (only if they don't exist)
    try {
      await queryInterface.addIndex('projects', ['status']);
    } catch (error) {
      console.log('Status index might already exist');
    }

    try {
      await queryInterface.addIndex('projects', ['is_active']);
    } catch (error) {
      console.log('Is_active index might already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    try {
      await queryInterface.removeIndex('projects', ['is_active']);
    } catch (error) {
      console.log('Is_active index might not exist');
    }

    try {
      await queryInterface.removeIndex('projects', ['status']);
    } catch (error) {
      console.log('Status index might not exist');
    }

    // Remove columns
    try {
      await queryInterface.removeColumn('projects', 'is_active');
    } catch (error) {
      console.log('Is_active column might not exist');
    }

    try {
      await queryInterface.removeColumn('projects', 'budget');
    } catch (error) {
      console.log('Budget column might not exist');
    }

    try {
      await queryInterface.removeColumn('projects', 'client');
    } catch (error) {
      console.log('Client column might not exist');
    }

    try {
      await queryInterface.removeColumn('projects', 'end_date');
    } catch (error) {
      console.log('End_date column might not exist');
    }

    try {
      await queryInterface.removeColumn('projects', 'start_date');
    } catch (error) {
      console.log('Start_date column might not exist');
    }

    try {
      await queryInterface.removeColumn('projects', 'status');
    } catch (error) {
      console.log('Status column might not exist');
    }

    try {
      await queryInterface.removeColumn('projects', 'description');
    } catch (error) {
      console.log('Description column might not exist');
    }
  }
}; 