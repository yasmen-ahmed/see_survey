const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_SESSION_ID = '2025-06-10T13:19:14.277Zsite1'; // Use your actual session ID

async function debugRanEquipmentAPI() {
  try {
    console.log('🔍 Debugging RAN Equipment API...\n');
    
    // Test data for PUT request
    const testData = {
      existing_location: "Building A, Floor 2",
      existing_vendor: "Nokia",
      existing_type_model: ["Model X1", "Model X2"],
      new_installation_location: ["Cabinet 1", "Cabinet 2"],
      length_of_transmission_cable: 150.5
    };

    console.log('📤 Testing PUT /api/ran-equipment/' + TEST_SESSION_ID);
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    // Make PUT request
    const putResponse = await axios.put(
      `${BASE_URL}/api/ran-equipment/${TEST_SESSION_ID}`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ PUT Request Response:');
    console.log('Status:', putResponse.status);
    console.log('Response:', JSON.stringify(putResponse.data, null, 2));
    
    console.log('\n📥 Testing GET /api/ran-equipment/' + TEST_SESSION_ID);
    
    // Make GET request to verify the data was saved
    const getResponse = await axios.get(`${BASE_URL}/api/ran-equipment/${TEST_SESSION_ID}`);
    
    console.log('✅ GET Request Response:');
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResponse.data, null, 2));
    
    // Check if the data matches what we sent
    const savedData = getResponse.data.data.ranEquipment;
    console.log('\n🔍 Data Comparison:');
    console.log('Sent existing_location:', testData.existing_location);
    console.log('Saved existing_location:', savedData.existing_location);
    console.log('Sent existing_vendor:', testData.existing_vendor);
    console.log('Saved existing_vendor:', savedData.existing_vendor);
    console.log('Sent length_of_transmission_cable:', testData.length_of_transmission_cable);
    console.log('Saved length_of_transmission_cable:', savedData.length_of_transmission_cable);
    
  } catch (error) {
    console.error('❌ Debug failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test with minimal data
async function testMinimalData() {
  console.log('\n🧪 Testing with minimal data...\n');
  
  const minimalData = {
    existing_vendor: "Nokia"
  };
  
  try {
    const response = await axios.put(
      `${BASE_URL}/api/ran-equipment/${TEST_SESSION_ID}`,
      minimalData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Minimal data test successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Minimal data test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the debug tests
async function runDebugTests() {
  await debugRanEquipmentAPI();
  await testMinimalData();
}

runDebugTests(); 