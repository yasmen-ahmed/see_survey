'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('notifications'));
    
    if (tableExists) {
      console.log('Notifications table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('notifications', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('survey_created', 'status_change', 'assignment', 'rework', 'approval'),
        allowNull: false
      },
      related_survey_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        references: {
          model: 'survey',
          key: 'session_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      related_project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes with unique names to avoid conflicts
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'notifications_user_id_idx'
    });
    await queryInterface.addIndex('notifications', ['is_read'], {
      name: 'notifications_is_read_idx'
    });
    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'notifications_created_at_idx'
    });
    await queryInterface.addIndex('notifications', ['type'], {
      name: 'notifications_type_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Check if table exists before dropping
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('notifications'));
    
    if (tableExists) {
      await queryInterface.dropTable('notifications');
    } else {
      console.log('Notifications table does not exist, nothing to drop');
    }
  }
};
