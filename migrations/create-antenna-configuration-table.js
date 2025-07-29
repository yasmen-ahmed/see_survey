'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('antenna_configuration', {
      session_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'survey',
          key: 'session_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      antenna_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 15
        }
      },
      antennas: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of antenna objects, each containing all antenna configuration fields'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('antenna_configuration', ['session_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('antenna_configuration');
  }
};