'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('new_antennas', 'antennaVendor', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: ''
      }),
      queryInterface.addColumn('new_antennas', 'antennaVendorOther', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: ''
      }),
      queryInterface.addColumn('new_antennas', 'antennaHeight', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn('new_antennas', 'antennaWeight', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn('new_antennas', 'antennaDiameter', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('new_antennas', 'antennaVendor'),
      queryInterface.removeColumn('new_antennas', 'antennaVendorOther'),
      queryInterface.removeColumn('new_antennas', 'antennaHeight'),
      queryInterface.removeColumn('new_antennas', 'antennaWeight'),
      queryInterface.removeColumn('new_antennas', 'antennaDiameter')
    ]);
  }
};
