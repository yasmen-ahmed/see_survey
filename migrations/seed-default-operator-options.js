'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Default operator options
    const defaultOperators = JSON.stringify(['Operator A', 'Operator B', 'Operator C']);
    
    // Update existing records that don't have operator options set
    await queryInterface.sequelize.query(`
      UPDATE site_area_info 
      SET other_telecom_operators_exist_onsite = :defaultOperators 
      WHERE other_telecom_operators_exist_onsite IS NULL 
      OR other_telecom_operators_exist_onsite = ''
    `, {
      replacements: { defaultOperators },
      type: Sequelize.QueryTypes.UPDATE
    });

    console.log('Default operator options seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the default operator options (set to NULL)
    await queryInterface.sequelize.query(`
      UPDATE site_area_info 
      SET other_telecom_operators_exist_onsite = NULL 
      WHERE other_telecom_operators_exist_onsite = :defaultOperators
    `, {
      replacements: { defaultOperators: JSON.stringify(['Operator A', 'Operator B', 'Operator C']) },
      type: Sequelize.QueryTypes.UPDATE
    });

    console.log('Default operator options removed successfully');
  }
}; 