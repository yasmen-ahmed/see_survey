'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('external_dc_distribution', 'has_separate_dc_pdu', {
      type: Sequelize.STRING(10),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('external_dc_distribution', 'has_separate_dc_pdu', {
      type: Sequelize.ENUM('Yes', 'No'),
      allowNull: true
    });
  }
}; 