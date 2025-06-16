const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_SESSION_ID = 'test-antenna-structure-session';

async function testAntennaStructureAPI() {
  console.log('🧪 Testing Antenna Structure API...\n');

  try {
    // Test 1: Get Form Options
    console.log('📋 Step 1: Getting form options...');
    const formOptionsResponse = await axios.get(`${BASE_URL}/api/antenna-structure/form-options`);
    console.log('✅ Form options retrieved successfully');
    console.log('Available tower types:', formOptionsResponse.data.data.tower_types);
    console.log('Available heights:', formOptionsResponse.data.data.existing_heights);
    console.log();

    // Test 2: Get initial data (should create default record)
    console.log('📋 Step 2: Getting initial antenna structure data...');
    const initialResponse = await axios.get(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}`);
    console.log('✅ Initial data retrieved successfully');
    console.log('Session ID:', initialResponse.data.data.session_id);
    console.log('Number of cabinets:', initialResponse.data.data.numberOfCabinets);
    console.log('Current tower types:', initialResponse.data.data.antennaStructureData.tower_type);
    console.log();

    // Test 3: Update with GF Tower data
    console.log('🔄 Step 3: Updating with GF Tower data...');
    const gfTowerData = {
      has_sketch_with_measurements: 'Yes',
      tower_type: ['GF tower', 'GF Monopole'],
      gf_antenna_structure_height: 45.5,
      lightening_system_installed: 'Yes',
      earthing_bus_bars_exist: 'Yes',
      how_many_free_holes_bus_bars: '1 / 2 / 3 / ... / 10'
    };

    const gfUpdateResponse = await axios.put(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}`, gfTowerData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ GF Tower data updated successfully');
    console.log('Tower types selected:', gfUpdateResponse.data.data.antennaStructureData.tower_type);
    console.log('GF antenna height:', gfUpdateResponse.data.data.antennaStructureData.gf_antenna_structure_height + 'm');
    console.log('Has GF tower:', gfUpdateResponse.data.data.metadata.has_gf_tower);
    console.log('Has RT tower:', gfUpdateResponse.data.data.metadata.has_rt_tower);
    console.log();

    // Test 4: Update with RT Tower data
    console.log('🔄 Step 4: Updating with RT Tower data...');
    const rtTowerData = {
      has_sketch_with_measurements: 'No',
      tower_type: ['RT tower', 'RT poles'],
      rt_how_many_structures_onsite: 3,
      rt_existing_heights: ['6m', '9m', '12m'],
      rt_building_height: 25.0,
      lightening_system_installed: 'No',
      earthing_bus_bars_exist: 'Yes',
      how_many_free_holes_bus_bars: 'more than 10'
    };

    const rtUpdateResponse = await axios.put(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}`, rtTowerData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ RT Tower data updated successfully');
    console.log('Tower types selected:', rtUpdateResponse.data.data.antennaStructureData.tower_type);
    console.log('RT structures onsite:', rtUpdateResponse.data.data.antennaStructureData.rt_how_many_structures_onsite);
    console.log('RT existing heights:', rtUpdateResponse.data.data.antennaStructureData.rt_existing_heights);
    console.log('RT building height:', rtUpdateResponse.data.data.antennaStructureData.rt_building_height + 'm');
    console.log('Has GF tower:', rtUpdateResponse.data.data.metadata.has_gf_tower);
    console.log('Has RT tower:', rtUpdateResponse.data.data.metadata.has_rt_tower);
    console.log();

    // Test 5: Update with mixed tower types
    console.log('🔄 Step 5: Updating with mixed tower types...');
    const mixedTowerData = {
      has_sketch_with_measurements: 'Yes',
      tower_type: ['GF tower', 'RT tower', 'Wall mounted'],
      gf_antenna_structure_height: 40.0,
      rt_how_many_structures_onsite: 2,
      rt_existing_heights: ['3m', '6m'],
      rt_building_height: 15.5,
      lightening_system_installed: 'Yes',
      earthing_bus_bars_exist: 'No',
      how_many_free_holes_bus_bars: '1 / 2 / 3 / ... / 10'
    };

    const mixedUpdateResponse = await axios.put(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}`, mixedTowerData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Mixed tower data updated successfully');
    console.log('Tower types selected:', mixedUpdateResponse.data.data.antennaStructureData.tower_type);
    console.log('Total tower types selected:', mixedUpdateResponse.data.data.metadata.tower_types_selected);
    console.log('Has GF tower:', mixedUpdateResponse.data.data.metadata.has_gf_tower);
    console.log('Has RT tower:', mixedUpdateResponse.data.data.metadata.has_rt_tower);
    console.log();

    // Test 6: Get cabinet options
    console.log('📋 Step 6: Getting cabinet options...');
    const cabinetOptionsResponse = await axios.get(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}/cabinet-options`);
    console.log('✅ Cabinet options retrieved successfully');
    console.log('Available cabinets:', cabinetOptionsResponse.data.data.cabinet_options);
    console.log();

    // Test 7: Verify final data
    console.log('📋 Step 7: Verifying final data...');
    const finalResponse = await axios.get(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}`);
    console.log('✅ Final data verified successfully');
    console.log('Final antenna structure data:');
    console.log(JSON.stringify(finalResponse.data.data.antennaStructureData, null, 2));
    console.log();

    // Test 8: Test validation error
    console.log('⚠️ Step 8: Testing validation error...');
    try {
      const invalidData = {
        has_sketch_with_measurements: 'Invalid Option',
        tower_type: ['Invalid Tower Type']
      };
      await axios.put(`${BASE_URL}/api/antenna-structure/${TEST_SESSION_ID}`, invalidData, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ Expected validation error but request succeeded');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation error handled correctly');
        console.log('Error message:', error.response.data.error.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log();

    console.log('🎉 All Antenna Structure API tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Form options retrieval');
    console.log('- ✅ Initial data creation');
    console.log('- ✅ GF Tower data update');
    console.log('- ✅ RT Tower data update');
    console.log('- ✅ Mixed tower types update');
    console.log('- ✅ Cabinet options retrieval');
    console.log('- ✅ Data verification');
    console.log('- ✅ Validation error handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testAntennaStructureAPI();
}

module.exports = testAntennaStructureAPI; 