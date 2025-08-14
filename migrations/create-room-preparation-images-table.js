'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_preparation_images', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: 'survey',
          key: 'session_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      upload_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('room_preparation_images', ['session_id']);
    await queryInterface.addIndex('room_preparation_images', ['category']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('room_preparation_images');
  }
}; 