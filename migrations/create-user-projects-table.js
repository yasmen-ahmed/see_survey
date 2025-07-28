'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if user_projects table already exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('user_projects'));
    
    if (tableExists) {
      console.log('User projects table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('user_projects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      role_in_project: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'User role within this specific project'
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Project-specific permissions for this user'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('user_projects', ['user_id']);
    await queryInterface.addIndex('user_projects', ['project_id']);
    await queryInterface.addIndex('user_projects', ['assigned_by']);
    await queryInterface.addIndex('user_projects', ['is_active']);
    await queryInterface.addIndex('user_projects', ['user_id', 'project_id'], {
      unique: true,
      name: 'unique_user_project'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_projects');
  }
}; 