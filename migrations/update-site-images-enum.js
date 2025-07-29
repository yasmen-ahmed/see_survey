'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For MySQL, we need to modify the ENUM to include new values
    // First, let's check if the new values already exist
    const tableDescription = await queryInterface.describeTable('site_images');
    const currentEnum = tableDescription.image_category.type;
    
    // If the ENUM doesn't include the new values, we need to modify it
    if (!currentEnum.includes('site_map_snapshot') || !currentEnum.includes('site_id_picture')) {
      // For MySQL, we need to create a new ENUM with all values
      await queryInterface.sequelize.query(`
        ALTER TABLE site_images 
        MODIFY COLUMN image_category ENUM(
          'site_entrance',
          'building_stairs_lift',
          'roof_entrance',
          'base_station_shelter',
          'site_name_shelter',
          'crane_access_street',
          'crane_location',
          'site_environment',
          'site_map_snapshot',
          'site_id_picture'
        ) NOT NULL
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to the original ENUM without the new categories
    await queryInterface.sequelize.query(`
      ALTER TABLE site_images 
      MODIFY COLUMN image_category ENUM(
        'site_entrance',
        'building_stairs_lift',
        'roof_entrance',
        'base_station_shelter',
        'site_name_shelter',
        'crane_access_street',
        'crane_location',
        'site_environment',
              'site_map_snapshot',
          'site_id_picture'
      ) NOT NULL
    `);
  }
}; 