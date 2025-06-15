const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust port if different
const TEST_SESSION_ID = 'test-transmission-' + Date.now();

async function testTransmissionMWAPI() {
  try {
    console.log('🧪 Testing Transmission/MW API...\n');
    
    // Test data for PUT request with 3 MW links
    const testData = {
      type_of_transmission: "Fiber",
      existing_transmission_base_band_location: "Existing cabinet #1",
      existing_transmission_equipment_vendor: "Nokia",
      existing_odf_location: "Existing cabinet #2",
      cable_length_odf_to_baseband: 25.5,
      odf_fiber_cable_type: "LC",
      how_many_free_ports_odf: 8,
      how_many_mw_link_exist: 3, // This will create 3 MW link sections
      mw_links: [
        {
          located_in: "Building A",
          mw_equipment_vendor: "Nokia",
          idu_type: "IDU Type 1",
          card_type_model: "Card Model X1",
          destination_site_id: "SITE001",
          mw_backhauling_type: "Ethernet",
          ethernet_ports_used: 4,
          ethernet_ports_free: 2
        },
        {
          located_in: "Building B",
          mw_equipment_vendor: "Ericsson",
          idu_type: "IDU Type 2",
          card_type_model: "Card Model Y2",
          destination_site_id: "SITE002",
          mw_backhauling_type: "Fiber",
          ethernet_ports_used: 6,
          ethernet_ports_free: 4
        },
        {
          located_in: "Building C",
          mw_equipment_vendor: "Huawei",
          idu_type: "IDU Type 3",
          card_type_model: "Card Model Z3",
          destination_site_id: "SITE003",
          mw_backhauling_type: "Ethernet",
          ethernet_ports_used: 3,
          ethernet_ports_free: 5
        }
      ]
    };

    console.log('📤 Testing PUT /api/transmission-mw/' + TEST_SESSION_ID);
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    // Make PUT request
    const putResponse = await axios.put(
      `${BASE_URL}/api/transmission-mw/${TEST_SESSION_ID}`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ PUT Request successful!');
    console.log('Status:', putResponse.status);
    console.log('Response:', JSON.stringify(putResponse.data, null, 2));
    
    console.log('\n📥 Testing GET /api/transmission-mw/' + TEST_SESSION_ID);
    
    // Make GET request to verify the data was saved
    const getResponse = await axios.get(`${BASE_URL}/api/transmission-mw/${TEST_SESSION_ID}`);
    
    console.log('✅ GET Request successful!');
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResponse.data, null, 2));
    
    console.log('\n📋 Testing GET /api/transmission-mw/' + TEST_SESSION_ID + '/cabinet-options');
    
    // Test cabinet options endpoint
    const optionsResponse = await axios.get(`${BASE_URL}/api/transmission-mw/${TEST_SESSION_ID}/cabinet-options`);
    
    console.log('✅ Cabinet Options Request successful!');
    console.log('Status:', optionsResponse.status);
    console.log('Response:', JSON.stringify(optionsResponse.data, null, 2));
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`- Session ID: ${TEST_SESSION_ID}`);
    console.log(`- Number of MW Links: ${getResponse.data.data.transmissionData.how_many_mw_link_exist}`);
    console.log(`- MW Links created: ${getResponse.data.data.transmissionData.mw_links.length}`);
    console.log(`- Cabinet count synced: ${getResponse.data.data.numberOfCabinets}`);
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test with different number of MW links
async function testDynamicMWLinks() {
  console.log('\n🔄 Testing Dynamic MW Links...\n');
  
  const testCases = [1, 2, 5]; // Test with 1, 2, and 5 MW links
  
  for (const numLinks of testCases) {
    try {
      const sessionId = `test-mw-${numLinks}-links-${Date.now()}`;
      
      const testData = {
        type_of_transmission: "MW",
        how_many_mw_link_exist: numLinks,
        mw_links: Array.from({ length: numLinks }, (_, i) => ({
          located_in: `Location ${i + 1}`,
          mw_equipment_vendor: "Nokia",
          idu_type: `IDU Type ${i + 1}`,
          card_type_model: `Card Model ${i + 1}`,
          destination_site_id: `SITE00${i + 1}`,
          mw_backhauling_type: "Ethernet",
          ethernet_ports_used: 2,
          ethernet_ports_free: 3
        }))
      };
      
      console.log(`📤 Testing with ${numLinks} MW links...`);
      
      const response = await axios.put(
        `${BASE_URL}/api/transmission-mw/${sessionId}`,
        testData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log(`✅ ${numLinks} MW links test successful!`);
      console.log(`   Created ${response.data.data.transmissionData.mw_links.length} MW link sections`);
      
    } catch (error) {
      console.error(`❌ ${numLinks} MW links test failed:`, error.response?.data || error.message);
    }
  }
}

// Run the tests
async function runAllTests() {
  await testTransmissionMWAPI();
  await testDynamicMWLinks();
}

runAllTests(); 