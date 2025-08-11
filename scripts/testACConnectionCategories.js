const axios = require('axios');

async function testACConnectionCategories() {
  try {
    const response = await axios.get('http://localhost:3000/api/gallery/2025-06-10T13:19:14.277Zsite1');
    
    if (response.data.success) {
      const acConnectionSection = response.data.data.sections.ac_connection;
      
      console.log('🔍 AC Connection Section Analysis:');
      console.log('Section Name:', acConnectionSection.section_name);
      console.log('Available Categories:', Object.keys(acConnectionSection.images));
      
      // Find generator photo categories
      const generatorCategories = Object.keys(acConnectionSection.images).filter(category => 
        category.startsWith('generator_photo_')
      );
      
      console.log('\n📸 Generator Photo Categories Found:');
      generatorCategories.forEach(category => {
        const images = acConnectionSection.images[category];
        console.log(`  ${category}: ${images.length} image(s)`);
      });
      
      // Group by generator number
      const generatorNumbers = new Set();
      generatorCategories.forEach(category => {
        const parts = category.split('_');
        if (parts.length >= 4) {
          generatorNumbers.add(parts[3]);
        }
      });
      
      console.log('\n🔢 Generator Numbers Detected:', Array.from(generatorNumbers).sort());
      
      // Show what categories should be generated
      const expectedCategories = ['generator_photo']; // Base category
      generatorNumbers.forEach(generatorNum => {
        expectedCategories.push(`generator_photo_1_${generatorNum}`);
        expectedCategories.push(`generator_photo_2_${generatorNum}`);
      });
      expectedCategories.push('fuel_tank_photo', 'transformer_photo');
      
      console.log('\n📋 Expected Categories for Gallery:');
      expectedCategories.forEach(category => {
        const hasImages = acConnectionSection.images[category] && acConnectionSection.images[category].length > 0;
        console.log(`  ${category}: ${hasImages ? '✅ Has images' : '❌ No images'}`);
      });
      
    } else {
      console.log('❌ API Error:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testACConnectionCategories(); 