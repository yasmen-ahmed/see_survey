'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('power_meter', 'powerMeterCapacity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('power_meter', 'powerMeterCapacity', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });
  }
};
