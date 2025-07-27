'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Since RadioUnits uses a JSON field for radio_units array, we don't need to add columns
    // The new fields (band, connectedToBaseBand, actionPlanned) will be stored in the JSON
    // However, we should update the model validation to include these new fields
    
    console.log('RadioUnits model uses JSON field - no database columns need to be added');
    console.log('New fields (band, connectedToBaseBand, actionPlanned) will be stored in the JSON radio_units array');
    
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // No columns to remove since we're using JSON field
    return Promise.resolve();
  }
}; 