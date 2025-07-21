'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ac_connection_info', 'transformer_capacity', {
      type: Sequelize.FLOAT,
      allowNull: true,
      validate: {
        min: 0
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ac_connection_info', 'transformer_capacity');
  }
}; 