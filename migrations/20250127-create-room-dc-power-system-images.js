'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_dc_power_system_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Links to room_dc_power_system.session_id'
      },
      record_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Index for multiple records of same category'
      },
      image_category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Category of photo, e.g. overall_rectifier_cabinet_photo, rectifier_module_photo_1, etc.'
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
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('room_dc_power_system_images', ['session_id'], {
      name: 'room_dc_power_system_images_session_id_idx'
    });

    await queryInterface.addIndex('room_dc_power_system_images', ['session_id', 'image_category'], {
      name: 'room_dc_power_system_images_session_category_idx'
    });

    await queryInterface.addIndex('room_dc_power_system_images', ['stored_filename'], {
      unique: true,
      name: 'room_dc_power_system_images_stored_filename_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('room_dc_power_system_images');
  }
}; 