const { AntennaConfiguration } = require('../models/AntennaConfiguration');

async function fixAntennaCountValidation() {
  try {
    console.log('Starting antenna count validation fix...');
    
    // Find all records with antenna_count = 0
    const recordsToFix = await AntennaConfiguration.findAll({
      where: {
        antenna_count: 0
      }
    });
    
    console.log(`Found ${recordsToFix.length} records with antenna_count = 0`);
    
    if (recordsToFix.length === 0) {
      console.log('No records need fixing. All antenna_count values are valid.');
      return;
    }
    
    // Update all records to have antenna_count = 1
    for (const record of recordsToFix) {
      await record.update({
        antenna_count: 1
      });
      console.log(`Fixed record for session: ${record.session_id}`);
    }
    
    console.log(`Successfully fixed ${recordsToFix.length} records.`);
    
  } catch (error) {
    console.error('Error fixing antenna count validation:', error);
    throw error;
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixAntennaCountValidation()
    .then(() => {
      console.log('Antenna count validation fix completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Antenna count validation fix failed:', error);
      process.exit(1);
    });
}

module.exports = fixAntennaCountValidation; 