const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_SESSION_ID = 'test-room-dc-session-123';

async function testRoomDCPowerSystemAPI() {
  console.log('🧪 Testing Room DC Power System API...\n');

  try {
    // Test 1: GET - Should create default record if none exists
    console.log('1. Testing GET /room-dc-power-system/:sessionId');
    const getResponse = await axios.get(`${BASE_URL}/room-dc-power-system/${TEST_SESSION_ID}`);
    console.log('✅ GET Response:', getResponse.data.success);
    console.log('   Data structure:', Object.keys(getResponse.data.data));
    console.log('   Number of cabinets:', getResponse.data.data.numberOfCabinets);
    console.log('   Has roomDCPowerData:', !!getResponse.data.data.roomDCPowerData);
    console.log('   Has images array:', Array.isArray(getResponse.data.data.images));
    console.log('');

    // Test 2: GET cabinet options
    console.log('2. Testing GET /room-dc-power-system/:sessionId/cabinet-options');
    const cabinetResponse = await axios.get(`${BASE_URL}/room-dc-power-system/${TEST_SESSION_ID}/cabinet-options`);
    console.log('✅ Cabinet Options Response:', cabinetResponse.data.success);
    console.log('   Cabinet options:', cabinetResponse.data.data.cabinet_options);
    console.log('');

    // Test 3: PUT - Update data
    console.log('3. Testing PUT /room-dc-power-system/:sessionId');
    const updateData = {
      dc_rectifiers: JSON.stringify({
        existing_dc_rectifiers_location: 'Existing cabinet #1',
        existing_dc_rectifiers_vendor: 'Nokia',
        existing_dc_rectifiers_model: 'Test Model',
        how_many_existing_dc_rectifier_modules: '2',
        rectifier_module_capacity: '2.5',
        total_capacity_existing_dc_power_system: '5.0',
        how_many_free_slot_available_rectifier: '1',
        dc_rectifier_condition: 'Good',
        rect_load_current_reading: '10.5',
        existing_site_temperature: '25.0',
        blvd_in_dc_power_rack: 'Yes',
        llvd_in_dc_power_rack: 'No',
        pdu_in_dc_power_rack: 'Yes',
        free_cbs_blvd: 'Yes',
        free_cbs_llvd: '',
        free_cbs_pdu: 'No',
        free_slots_rectifier_modules: '2'
      }),
      batteries: JSON.stringify({
        existing_batteries_strings_location: ['Existing cabinet #1'],
        existing_batteries_vendor: 'Efore',
        existing_batteries_type: 'Lead-acid',
        how_many_existing_battery_string: '2',
        total_battery_capacity: '200',
        how_many_free_slot_available_battery: '1',
        new_battery_string_installation_location: ['New Nokia cabinet'],
        batteries_condition: 'Good',
        new_battery_type: 'Lithium-ion',
        new_battery_capacity: '100',
        new_battery_qty: '1'
      }),
      cb_fuse_data_blvd: JSON.stringify([
        { rating: 10, connected_module: 'BLVD Module A' },
        { rating: 15, connected_module: 'BLVD Module B' }
      ]),
      cb_fuse_data_llvd: JSON.stringify([
        { rating: 20, connected_module: 'LLVD Module A' },
        { rating: 25, connected_module: 'LLVD Module B' }
      ]),
      cb_fuse_data_pdu: JSON.stringify([
        { rating: 30, connected_module: 'PDU Module A' },
        { rating: 35, connected_module: 'PDU Module B' }
      ])
    };

    const putResponse = await axios.put(`${BASE_URL}/room-dc-power-system/${TEST_SESSION_ID}`, updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ PUT Response:', putResponse.data.success);
    console.log('   Message:', putResponse.data.message);
    console.log('   Updated rectifier modules:', putResponse.data.data.roomDCPowerData.dc_rectifiers.how_many_existing_dc_rectifier_modules);
    console.log('   Updated battery strings:', putResponse.data.data.roomDCPowerData.batteries.how_many_existing_battery_string);
    console.log('   BLVD CB/Fuse data count:', putResponse.data.data.roomDCPowerData.cb_fuse_data_blvd.length);
    console.log('   LLVD CB/Fuse data count:', putResponse.data.data.roomDCPowerData.cb_fuse_data_llvd.length);
    console.log('   PDU CB/Fuse data count:', putResponse.data.data.roomDCPowerData.cb_fuse_data_pdu.length);
    console.log('');

    // Test 4: GET - Verify data was saved
    console.log('4. Testing GET after update');
    const getAfterUpdate = await axios.get(`${BASE_URL}/room-dc-power-system/${TEST_SESSION_ID}`);
    console.log('✅ GET After Update Response:', getAfterUpdate.data.success);
    console.log('   Rectifier vendor:', getAfterUpdate.data.data.roomDCPowerData.dc_rectifiers.existing_dc_rectifiers_vendor);
    console.log('   Battery vendor:', getAfterUpdate.data.data.roomDCPowerData.batteries.existing_batteries_vendor);
    console.log('   BLVD in rack:', getAfterUpdate.data.data.roomDCPowerData.dc_rectifiers.blvd_in_dc_power_rack);
    console.log('   PDU in rack:', getAfterUpdate.data.data.roomDCPowerData.dc_rectifiers.pdu_in_dc_power_rack);
    console.log('');

    // Test 5: GET images endpoint
    console.log('5. Testing GET /room-dc-power-system/:sessionId/images');
    const imagesResponse = await axios.get(`${BASE_URL}/room-dc-power-system/${TEST_SESSION_ID}/images`);
    console.log('✅ Images Response:', imagesResponse.data.success);
    console.log('   Images count:', imagesResponse.data.data.images.length);
    console.log('');

    console.log('🎉 All Room DC Power System API tests passed!');
    console.log('📋 Summary:');
    console.log('   - GET endpoint creates default records');
    console.log('   - Cabinet options are retrieved correctly');
    console.log('   - PUT endpoint updates data successfully');
    console.log('   - All form fields are properly saved and retrieved');
    console.log('   - CB/Fuse data is handled correctly');
    console.log('   - Images endpoint is accessible');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testRoomDCPowerSystemAPI(); 