'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('site_access', 'environment_cultural_problems', {
      type: Sequelize.STRING,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'environment_cultural_problems_details', {
      type: Sequelize.TEXT,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'aviation_problems', {
      type: Sequelize.STRING,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'aviation_problems_details', {
      type: Sequelize.TEXT,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'military_problems', {
      type: Sequelize.STRING,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'military_problems_details', {
      type: Sequelize.TEXT,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'why_crane_needed', {
      type: Sequelize.TEXT,
      defaultValue: ''
    });

    await queryInterface.addColumn('site_access', 'need_crane_permission', {
      type: Sequelize.STRING,
      defaultValue: ''
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('site_access', 'environment_cultural_problems');
    await queryInterface.removeColumn('site_access', 'environment_cultural_problems_details');
    await queryInterface.removeColumn('site_access', 'aviation_problems');
    await queryInterface.removeColumn('site_access', 'aviation_problems_details');
    await queryInterface.removeColumn('site_access', 'military_problems');
    await queryInterface.removeColumn('site_access', 'military_problems_details');
    await queryInterface.removeColumn('site_access', 'why_crane_needed');
    await queryInterface.removeColumn('site_access', 'need_crane_permission');
  }
}; 