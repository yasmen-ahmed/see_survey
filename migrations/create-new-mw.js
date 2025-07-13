'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('new_mw', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      session_id: { type: Sequelize.STRING, allowNull: false },
      mw_index: { type: Sequelize.INTEGER, allowNull: false },
      fields: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('new_mw');
  }
};

