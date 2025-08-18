'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_dc_power_system', {
      session_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255]
        }
      },
      number_of_cabinets: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 50
        }
      },
      room_dc_power_data: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('room_dc_power_system', ['session_id'], {
      unique: true,
      name: 'room_dc_power_system_session_id_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('room_dc_power_system');
  }
}; 