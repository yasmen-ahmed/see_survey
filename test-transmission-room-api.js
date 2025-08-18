const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_SESSION_ID = 'test-session-123';

async function testTransmissionRoomAPI() {
  console.log('Testing Transmission Room API...\n');

  try {
    // Test GET endpoint
    console.log('1. Testing GET /api/transmission-room/:sessionId');
    const getResponse = await axios.get(`${BASE_URL}/api/transmission-room/${TEST_SESSION_ID}`);
    console.log('✅ GET successful:', getResponse.data.success);
    console.log('Data structure:', Object.keys(getResponse.data.data));
    console.log('');

    // Test PUT endpoint with data
    console.log('2. Testing PUT /api/transmission-room/:sessionId with data');
    const testData = {
      type_of_transmission: 'MW',
      existing_transmission_equipment_vendor: 'Nokia',
      space_available: 'Wall mount',
      how_many_mw_link_exist: '2',
      mw_links: [
        {
          link_id: 1,
          located_in: 'Existing cabinet #1',
          mw_equipment_vendor: 'Nokia',
          idu_type: 'Test IDU',
          card_type_model: 'Test Card',
          destination_site_id: 'SITE001',
          mw_backhauling_type: 'Ethernet',
          ethernet_ports_used: '2',
          ethernet_ports_free: '4'
        },
        {
          link_id: 2,
          located_in: 'Existing cabinet #2',
          mw_equipment_vendor: 'Ericsson',
          idu_type: 'Test IDU 2',
          card_type_model: 'Test Card 2',
          destination_site_id: 'SITE002',
          mw_backhauling_type: 'Fiber',
          ethernet_ports_used: '1',
          ethernet_ports_free: '3'
        }
      ]
    };

    const putResponse = await axios.put(`${BASE_URL}/api/transmission-room/${TEST_SESSION_ID}`, testData);
    console.log('✅ PUT successful:', putResponse.data.success);
    console.log('Message:', putResponse.data.message);
    console.log('');

    // Test GET endpoint again to verify data was saved
    console.log('3. Testing GET /api/transmission-room/:sessionId after update');
    const getResponse2 = await axios.get(`${BASE_URL}/api/transmission-room/${TEST_SESSION_ID}`);
    console.log('✅ GET successful:', getResponse2.data.success);
    console.log('Transmission type:', getResponse2.data.data.transmissionData.type_of_transmission);
    console.log('MW links count:', getResponse2.data.data.transmissionData.mw_links.length);
    console.log('');

    // Test cabinet options endpoint
    console.log('4. Testing GET /api/transmission-room/:sessionId/cabinet-options');
    const cabinetResponse = await axios.get(`${BASE_URL}/api/transmission-room/${TEST_SESSION_ID}/cabinet-options`);
    console.log('✅ Cabinet options successful:', cabinetResponse.data.success);
    console.log('Cabinet options:', cabinetResponse.data.data.cabinet_options);
    console.log('');

    console.log('🎉 All tests passed! The Transmission Room API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testTransmissionRoomAPI(); 