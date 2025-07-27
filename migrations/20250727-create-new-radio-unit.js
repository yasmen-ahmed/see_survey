'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('new_radio_units', 'bseHeight', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0
      }),
 
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('new_radio_units', 'bseHeight'),
    
    ]);
  }
};
