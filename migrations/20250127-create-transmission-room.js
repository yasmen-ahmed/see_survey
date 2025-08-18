'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transmission_room', {
      session_id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false,
        comment: 'Session identifier linking to survey session'
      },
      number_of_cabinets: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Number of cabinets from outdoor_cabinets table'
      },
      transmission_data: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
        comment: 'JSON object containing all transmission room form data'
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
    await queryInterface.addIndex('transmission_room', ['session_id'], {
      unique: true,
      name: 'idx_transmission_room_session_id_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transmission_room');
  }
}; 