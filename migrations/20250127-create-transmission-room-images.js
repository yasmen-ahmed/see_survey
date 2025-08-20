'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transmission_room_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Primary key for image records'
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Links to transmission_room.session_id'
      },
      record_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Index for multiple records of same category'
      },
      image_category: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Category of photo, e.g. odf_photo, mw_idu_photo_1'
      },
      original_filename: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Original filename as uploaded by user'
      },
      stored_filename: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
        comment: 'Unique filename stored on server'
      },
      file_path: {
        type: Sequelize.STRING(1000),
        allowNull: false,
        comment: 'Full path to stored file'
      },
      file_url: {
        type: Sequelize.STRING(1000),
        allowNull: false,
        comment: 'URL path for accessing the file'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'File size in bytes'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME type of the file'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description for the image'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the image is active'
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
    await queryInterface.addIndex('transmission_room_images', ['session_id'], {
      name: 'idx_transmission_room_images_session_id'
    });
    
    await queryInterface.addIndex('transmission_room_images', ['session_id', 'image_category'], {
      name: 'idx_transmission_room_images_session_category'
    });
    
    await queryInterface.addIndex('transmission_room_images', ['stored_filename'], {
      unique: true,
      name: 'idx_transmission_room_images_stored_filename_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transmission_room_images');
  }
}; 