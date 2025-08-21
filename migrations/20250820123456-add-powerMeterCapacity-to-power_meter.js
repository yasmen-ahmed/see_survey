'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('power_meter', 'powerMeterCapacity', {
      type: Sequelize.FLOAT,
      allowNull: true,   // or false if required
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('power_meter', 'powerMeterCapacity');
  }
};
