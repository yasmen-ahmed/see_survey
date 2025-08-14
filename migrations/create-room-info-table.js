'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_info', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
      height: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      width: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      depth: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      hardware: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      sketch_available: {
        type: Sequelize.STRING(255),
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('room_info', ['session_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('room_info');
  }
}; 