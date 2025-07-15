const axios = require('axios');

/**
 * Script to add missing hierarchical data via API endpoints
 * Based on the Excel data structure from the user's image
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/hierarchical-data'; // Adjust port as needed

// Data from the image
const hierarchicalData = {
  'CEWA': [
    'Angola', 'Ethiopia', 'Ghana', 'Kenya', 'Nigeria', 'Other countries', 'Zimbabwe'
  ],
  'ME': [
    'Iran', 'Iraq', 'Jordan', 'Lebanon', 'Pakistan', 'Qatar', 'UAE'
  ],
  'NWA': [
    'Algeria', 'Cameroon', 'Egypt', 'Ivory Coast', 'Libya', 'Mali', 'Morocco', 'Senegal', 'Sudan', 'Togo', 'Tunisia'
  ],
  'Saudi': [
    'Saudi Arabia'
  ],
  'SAV': [
    'Congo', 'South Africa'
  ]
};

// Statistics tracking
const stats = {
  mus: { created: 0, existing: 0, errors: 0 },
  countries: { created: 0, existing: 0, errors: 0 }
};

/**
 * Create MU via API
 */
async function createMU(muName) {
  try {
    console.log(`Creating MU: ${muName}`);
    
    const response = await axios.post(`${API_BASE_URL}/mus`, {
      name: muName,
      code: muName.toUpperCase()
    });
    
    if (response.status === 201) {
      console.log(`  ✓ Created MU: ${muName} (ID: ${response.data.data.id})`);
      stats.mus.created++;
      return response.data.data;
    } else if (response.status === 409) {
      console.log(`  ✓ MU already exists: ${muName} (ID: ${response.data.data.id})`);
      stats.mus.existing++;
      return response.data.data;
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log(`  ✓ MU already exists: ${muName} (ID: ${error.response.data.data.id})`);
      stats.mus.existing++;
      return error.response.data.data;
    } else {
      console.error(`  ✗ Error creating MU ${muName}:`, error.response?.data?.message || error.message);
      stats.mus.errors++;
      return null;
    }
  }
}

/**
 * Create Country via API
 */
async function createCountry(countryName, muId) {
  try {
    console.log(`    Creating Country: ${countryName} for MU ID: ${muId}`);
    
    const response = await axios.post(`${API_BASE_URL}/countries`, {
      name: countryName,
      code: countryName.substring(0, 2).toUpperCase(),
      mu_id: muId
    });
    
    if (response.status === 201) {
      console.log(`      ✓ Created Country: ${countryName} (ID: ${response.data.data.id})`);
      stats.countries.created++;
      return response.data.data;
    } else if (response.status === 409) {
      console.log(`      ✓ Country already exists: ${countryName} (ID: ${response.data.data.id})`);
      stats.countries.existing++;
      return response.data.data;
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log(`      ✓ Country already exists: ${countryName} (ID: ${error.response.data.data.id})`);
      stats.countries.existing++;
      return error.response.data.data;
    } else {
      console.error(`      ✗ Error creating Country ${countryName}:`, error.response?.data?.message || error.message);
      stats.countries.errors++;
      return null;
    }
  }
}

/**
 * Get existing MU by name
 */
async function getMUByName(muName) {
  try {
    const response = await axios.get(`${API_BASE_URL}/mus`);
    const mu = response.data.find(m => m.name === muName);
    return mu || null;
  } catch (error) {
    console.error(`Error fetching MU ${muName}:`, error.message);
    return null;
  }
}

/**
 * Get existing Country by name and MU ID
 */
async function getCountryByNameAndMU(countryName, muId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/countries/${muId}`);
    const country = response.data.find(c => c.name === countryName);
    return country || null;
  } catch (error) {
    console.error(`Error fetching Country ${countryName}:`, error.message);
    return null;
  }
}

/**
 * Main function to add missing data
 */
async function addMissingData() {
  console.log('Starting to add missing hierarchical data via API...');
  console.log('==================================================');
  
  try {
    // Process each MU and its countries
    for (const [muName, countries] of Object.entries(hierarchicalData)) {
      console.log(`\nProcessing MU: ${muName}`);
      console.log(`Countries: ${countries.join(', ')}`);
      
      // Create or get MU
      let mu = await getMUByName(muName);
      if (!mu) {
        mu = await createMU(muName);
        if (!mu) {
          console.log(`  Skipping countries for MU ${muName} due to creation error`);
          continue;
        }
      } else {
        console.log(`  ✓ Found existing MU: ${muName} (ID: ${mu.id})`);
        stats.mus.existing++;
      }
      
      // Create countries for this MU
      for (const countryName of countries) {
        if (countryName.trim()) { // Skip empty country names
          await createCountry(countryName, mu.id);
        }
      }
    }
    
    // Print final statistics
    console.log('\n==================================================');
    console.log('FINAL STATISTICS:');
    console.log('==================================================');
    console.log(`MUs: ${stats.mus.created} created, ${stats.mus.existing} existing, ${stats.mus.errors} errors`);
    console.log(`Countries: ${stats.countries.created} created, ${stats.countries.existing} existing, ${stats.countries.errors} errors`);
    
    // Verify final data
    console.log('\nVerifying final data...');
    await verifyFinalData();
    
  } catch (error) {
    console.error('Error in addMissingData:', error.message);
  }
}

/**
 * Verify the final data by fetching and displaying it
 */
async function verifyFinalData() {
  try {
    console.log('\nFinal Data Verification:');
    console.log('=======================');
    
    const musResponse = await axios.get(`${API_BASE_URL}/mus`);
    const mus = musResponse.data;
    
    console.log(`Total MUs in database: ${mus.length}`);
    
    for (const mu of mus) {
      console.log(`\nMU: ${mu.name} (ID: ${mu.id})`);
      
      const countriesResponse = await axios.get(`${API_BASE_URL}/countries/${mu.id}`);
      const countries = countriesResponse.data;
      
      console.log(`  Countries (${countries.length}):`);
      countries.forEach(country => {
        console.log(`    - ${country.name} (ID: ${country.id})`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying final data:', error.message);
  }
}

/**
 * Test API connectivity
 */
async function testAPIConnectivity() {
  try {
    console.log('Testing API connectivity...');
    const response = await axios.get(`${API_BASE_URL}/mus`);
    console.log('✓ API is accessible');
    return true;
  } catch (error) {
    console.error('✗ API connectivity test failed:', error.message);
    console.error('Make sure your backend server is running on the correct port');
    return false;
  }
}

// Main execution
async function main() {
  console.log('Hierarchical Data API Import Script');
  console.log('===================================');
  
  // Test API connectivity first
  const isConnected = await testAPIConnectivity();
  if (!isConnected) {
    console.log('\nPlease start your backend server and try again.');
    process.exit(1);
  }
  
  // Add missing data
  await addMissingData();
  
  console.log('\nScript completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  addMissingData,
  createMU,
  createCountry,
  testAPIConnectivity
}; 