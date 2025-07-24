'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('antenna_structure', 'tower_manufacturer', {
      type: Sequelize.STRING,
      allowNull: true, // Not mandatory
      defaultValue: ''
    });

    await queryInterface.addColumn('antenna_structure', 'empty_mounts', {
      type: Sequelize.INTEGER,
      allowNull: true, // Not mandatory
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('antenna_structure', 'tower_manufacturer');
    await queryInterface.removeColumn('antenna_structure', 'empty_mounts');
  }
};
