const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const sessionId = '2025-06-10T13:19:14.277Zsite1';

async function testGalleryFrontend() {
  console.log('🧪 Testing Gallery Frontend Integration...\n');

  try {
    // Test 1: Check if API returns all sections (including empty ones)
    console.log('1. Testing API Response Structure...');
    
    const response = await axios.get(`${API_BASE_URL}/gallery/${sessionId}`);
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ API Response Structure:');
      console.log(`   Session ID: ${data.session_id}`);
      console.log(`   Total Sections: ${Object.keys(data.sections).length}`);
      
      // Check if all expected sections are present
      const expectedSections = [
        'general_site', 'antenna_structure', 'antennas', 'radio_units',
        'dc_power_system', 'outdoor_general_layout', 'outdoor_cabinets',
        'ac_connection', 'ac_panel', 'power_meter', 'mw_antennas',
        'transmission_mw', 'ran_equipment', 'external_dc_distribution',
        'new_antennas', 'new_radio_units', 'new_fpfhs', 'new_gps', 'new_mw'
      ];
      
      const missingSections = expectedSections.filter(section => !data.sections[section]);
      const emptySections = Object.keys(data.sections).filter(section => 
        Object.keys(data.sections[section].images).length === 0
      );
      
      console.log(`   Expected Sections: ${expectedSections.length}`);
      console.log(`   Present Sections: ${Object.keys(data.sections).length}`);
      console.log(`   Missing Sections: ${missingSections.length}`);
      console.log(`   Empty Sections: ${emptySections.length}`);
      
      if (missingSections.length > 0) {
        console.log(`   ❌ Missing: ${missingSections.join(', ')}`);
      }
      
      if (emptySections.length > 0) {
        console.log(`   📭 Empty: ${emptySections.join(', ')}`);
      }
      
      // Test 2: Check image display
      console.log('\n2. Testing Image Display...');
      
      let totalImages = 0;
      let sectionsWithImages = 0;
      
      Object.entries(data.sections).forEach(([sectionKey, section]) => {
        const sectionImageCount = Object.values(section.images).reduce((sum, images) => sum + images.length, 0);
        totalImages += sectionImageCount;
        
        if (sectionImageCount > 0) {
          sectionsWithImages++;
          console.log(`   ✅ ${section.section_name}: ${sectionImageCount} images`);
          
          // Check first image structure
          const firstCategory = Object.keys(section.images)[0];
          const firstImage = section.images[firstCategory][0];
          
          if (firstImage) {
            console.log(`      Sample: ${firstImage.original_filename} (${firstImage.file_size} bytes)`);
            console.log(`      URL: ${firstImage.file_url}`);
          }
        } else {
          console.log(`   📭 ${section.section_name}: 0 images (empty cards should show)`);
        }
      });
      
      console.log(`\n📊 Summary:`);
      console.log(`   Total Images: ${totalImages}`);
      console.log(`   Sections with Images: ${sectionsWithImages}`);
      console.log(`   Sections without Images: ${Object.keys(data.sections).length - sectionsWithImages}`);
      
      // Test 3: Verify frontend integration
      console.log('\n3. Testing Frontend Integration...');
      
      // Check if the gallery component path exists
      const fs = require('fs');
      const path = require('path');
      
      const galleryComponentPath = path.join(__dirname, '../see_survey_frontend/src/Components/Gallery/Gallery.jsx');
      const alltabsPath = path.join(__dirname, '../see_survey_frontend/src/Components/Tabs/Alltabs.jsx');
      
      if (fs.existsSync(galleryComponentPath)) {
        console.log('   ✅ Gallery component exists');
      } else {
        console.log('   ❌ Gallery component not found');
      }
      
      if (fs.existsSync(alltabsPath)) {
        console.log('   ✅ Alltabs.jsx exists');
        
        // Check if gallery is imported
        const alltabsContent = fs.readFileSync(alltabsPath, 'utf8');
        if (alltabsContent.includes('Gallery=React.lazy(()=>import("../Gallery/Gallery.jsx"))')) {
          console.log('   ✅ Gallery import found in Alltabs.jsx');
        } else {
          console.log('   ❌ Gallery import not found in Alltabs.jsx');
        }
        
        if (alltabsContent.includes('"gallery": [')) {
          console.log('   ✅ Gallery section found in tabs config');
        } else {
          console.log('   ❌ Gallery section not found in tabs config');
        }
      } else {
        console.log('   ❌ Alltabs.jsx not found');
      }
      
    } else {
      console.log('❌ API returned error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Error testing gallery frontend:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
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
    await testGalleryFrontend();
  }
}

main().catch(console.error); 