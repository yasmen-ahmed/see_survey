'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_preparation', {
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
      ac_type: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ac_count: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ac_capacity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      ac_status: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      cable_tray_height: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      cable_tray_width: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      existing_cable_tray_space: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      available_space_in_feeder_window: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      feeder_free_holes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      feeder_windows: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bus_bar_free_holes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rack_free_positions: {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('room_preparation', ['session_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('room_preparation');
  }
}; 