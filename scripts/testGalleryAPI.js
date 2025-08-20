const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test the gallery API
async function testGalleryAPI() {
  try {
    console.log('🧪 Testing Gallery API...\n');

    // Test 1: Get all images for a session
    console.log('1. Testing GET /api/gallery/:sessionId');
    
    // You'll need to replace this with a real session ID from your database
    const sessionId = 'test_session_123'; // Replace with actual session ID
    
    const response = await axios.get(`${API_BASE_URL}/gallery/${sessionId}`, {
      headers: {
        'Authorization': 'Bearer test-token' // Replace with actual token
      }
    });

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('Session ID:', data.session_id);
      console.log('Sections found:', Object.keys(data.sections).length);
      
      // Display sections and their image counts
      Object.entries(data.sections).forEach(([sectionKey, section]) => {
        const totalImages = Object.values(section.images).reduce((sum, images) => sum + images.length, 0);
        console.log(`  - ${section.section_name}: ${totalImages} images`);
        
        // Show categories in each section
        Object.entries(section.images).forEach(([category, images]) => {
          console.log(`    * ${category}: ${images.length} images`);
        });
      });
    } else {
      console.log('❌ API returned error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Error testing gallery API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test 2: Get images for a specific section
async function testSectionAPI() {
  try {
    console.log('\n2. Testing GET /api/gallery/:sessionId/:section');
    
    const sessionId = 'test_session_123'; // Replace with actual session ID
    const section = 'general_site'; // Test with general site section
    
    const response = await axios.get(`${API_BASE_URL}/gallery/${sessionId}/${section}`, {
      headers: {
        'Authorization': 'Bearer test-token' // Replace with actual token
      }
    });

    console.log('✅ Section response received:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('Session ID:', data.session_id);
      console.log('Section:', data.section);
      console.log('Images found:', data.images.length);
      
      // Show first few images
      data.images.slice(0, 3).forEach((image, index) => {
        console.log(`  Image ${index + 1}:`);
        console.log(`    - Category: ${image.image_category}`);
        console.log(`    - Filename: ${image.original_filename}`);
        console.log(`    - Size: ${image.file_size} bytes`);
        console.log(`    - URL: ${image.file_url}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing section API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Gallery API Tests\n');
  
  await testGalleryAPI();
  await testSectionAPI();
  
  console.log('\n✨ Gallery API tests completed!');
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error); 