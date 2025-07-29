'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create MW antennas table if it doesn't exist
    const tableExists = await queryInterface.showAllTables();
    if (!tableExists.includes('mw_antennas')) {
      await queryInterface.createTable('mw_antennas', {
        session_id: {
          type: Sequelize.STRING(255),
          primaryKey: true,
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 255]
          }
        },
        number_of_cabinets: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
            max: 50
          }
        },
        mw_antennas_data: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: {},
          comment: 'JSON structure containing MW antennas data including height, diameter, azimuth, oduLocation, operator, farEndSiteId, hopDistance, linkCapacity, actionPlanned'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      // Add unique index on session_id
      await queryInterface.addIndex('mw_antennas', {
        fields: ['session_id'],
        unique: true,
        name: 'idx_mw_antennas_session_id_unique'
      });

      // Add index on created_at for performance
      await queryInterface.addIndex('mw_antennas', {
        fields: ['created_at'],
        name: 'idx_mw_antennas_created_at'
      });

      // Add index on updated_at for performance
      await queryInterface.addIndex('mw_antennas', {
        fields: ['updated_at'],
        name: 'idx_mw_antennas_updated_at'
      });
    }

    // 2. Add other_telecom_operators_exist_onsite field to site_area_info table
    const siteAreaInfoColumns = await queryInterface.describeTable('site_area_info');
    if (!siteAreaInfoColumns.other_telecom_operators_exist_onsite) {
      await queryInterface.addColumn('site_area_info', 'other_telecom_operators_exist_onsite', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'JSON array of other telecom operators that exist on site, used for MW antennas operator selection'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the site_area_info field
    try {
      await queryInterface.removeColumn('site_area_info', 'other_telecom_operators_exist_onsite');
    } catch (error) {
      console.log('Column may not exist, skipping removal');
    }

    // Remove MW antennas table indexes and drop table
    try {
      await queryInterface.removeIndex('mw_antennas', 'idx_mw_antennas_session_id_unique');
      await queryInterface.removeIndex('mw_antennas', 'idx_mw_antennas_created_at');
      await queryInterface.removeIndex('mw_antennas', 'idx_mw_antennas_updated_at');
      await queryInterface.dropTable('mw_antennas');
    } catch (error) {
      console.log('Table or indexes may not exist, skipping removal');
    }
  }
}; 