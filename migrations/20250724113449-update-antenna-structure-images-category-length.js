'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Increase the image_category column length to handle longer category names
    await queryInterface.changeColumn('antenna_structure_images', 'image_category', {
      type: Sequelize.STRING(500), // Increased from default VARCHAR(255) to VARCHAR(500)
      allowNull: false,
      comment: 'Category/type of the antenna structure image'
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert back to original length
    await queryInterface.changeColumn('antenna_structure_images', 'image_category', {
      type: Sequelize.STRING(255), // Revert to original VARCHAR(255)
      allowNull: false,
      comment: 'Category/type of the antenna structure image'
    });
  }
};
