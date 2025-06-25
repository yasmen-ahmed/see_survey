'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('site_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: 'survey',
          key: 'session_id'
        }
      },
      image_category: {
        type: Sequelize.ENUM(
          'site_entrance',
          'building_stairs_lift',
          'roof_entrance',
          'base_station_shelter',
          'site_name_shelter',
          'crane_access_street',
          'crane_location',
          'site_environment'
        ),
        allowNull: false
      },
      original_filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      stored_filename: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('site_images', ['session_id'], {
      name: 'idx_site_images_session'
    });

    await queryInterface.addIndex('site_images', ['session_id', 'image_category'], {
      name: 'idx_site_images_category'
    });

    await queryInterface.addIndex('site_images', ['stored_filename'], {
      name: 'idx_site_images_stored',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('site_images');
  }
}; 