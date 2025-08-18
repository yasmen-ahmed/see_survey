const axios = require('axios');

const TEST_SESSION_ID = '2025-06-10T13:19:14.277Zsite1';
const BASE_URL = 'http://localhost:3000';

async function testRoomAPI() {
  try {
    console.log('Testing Room Info API...\n');
    
    // Test GET endpoint
    const response = await axios.get(`${BASE_URL}/api/room-info/${TEST_SESSION_ID}`);
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Response Data Structure:', Object.keys(response.data));
    
    if (response.data.images) {
      console.log('✅ Images found:', response.data.images.length);
      
      // Show all categories
      const categories = response.data.images.map(img => img.image_category);
      console.log('✅ All categories in response:', categories);
      
      // Check if images have the expected properties
      response.data.images.forEach((img, index) => {
        console.log(`\nImage ${index + 1}:`);
        console.log('  - id:', img.id);
        console.log('  - image_category:', img.image_category);
        console.log('  - original_filename:', img.original_filename);
        console.log('  - file_url:', img.file_url);
        console.log('  - stored_filename:', img.stored_filename);
      });
    } else {
      console.log('❌ No images in response');
    }
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testRoomAPI(); 