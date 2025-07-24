'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('outdoor_general_layout', 'distance_from_equipment_to_tower_base', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('outdoor_general_layout', 'is_earth_bus_bars_connected_to_main_earth_system', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('outdoor_general_layout', 'ac_electrical_sockets', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('outdoor_general_layout', 'distance_from_equipment_to_tower_base');
    await queryInterface.removeColumn('outdoor_general_layout', 'is_earth_bus_bars_connected_to_main_earth_system');
    await queryInterface.removeColumn('outdoor_general_layout', 'ac_electrical_sockets');
  }
}; 