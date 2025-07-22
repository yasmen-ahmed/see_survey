'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('power_meter', 'electrical_measurements', {
      type: Sequelize.JSON,
      defaultValue: null,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('power_meter', 'electrical_measurements');
  }
}; 