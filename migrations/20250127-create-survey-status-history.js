'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_status_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: 'survey',
          key: 'session_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Username who made the status change'
      },
      current_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Previous status before change'
      },
      new_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'New status after change'
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Timestamp when status was changed'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional notes about the status change'
      }
    });

    // Add indexes for better performance with unique names
    await queryInterface.addIndex('survey_status_history', ['session_id'], {
      name: 'idx_survey_status_history_session_id'
    });
    await queryInterface.addIndex('survey_status_history', ['username'], {
      name: 'idx_survey_status_history_username'
    });
    await queryInterface.addIndex('survey_status_history', ['changed_at'], {
      name: 'idx_survey_status_history_changed_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_status_history');
  }
}; 