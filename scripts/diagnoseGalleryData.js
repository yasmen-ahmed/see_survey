const axios = require('axios');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Import all image models
const SiteImages = require('../models/SiteImages');
const AntennaStructureImages = require('../models/AntennaStructureImages');
const AntennaImages = require('../models/AntennaImages');
const RadioUnitImages = require('../models/RadioUnitImages');
const DCPowerSystemImages = require('../models/DCPowerSystemImages');
const OutdoorGeneralLayoutImages = require('../models/OutdoorGeneralLayoutImages');
const OutdoorCabinetsImages = require('../models/OutdoorCabinetsImages');
const AcConnectionImages = require('../models/AcConnectionImages');
const AcPanelImages = require('../models/AcPanelImages');
const PowerMeterImages = require('../models/PowerMeterImages');
const MWAntennasImages = require('../models/MWAntennasImages');
const TransmissionMWImages = require('../models/TransmissionMWImages');
const RANEquipmentImages = require('../models/RANEquipmentImages');
const ExternalDCDistributionImages = require('../models/ExternalDCDistributionImages');
const NewAntennasImages = require('../models/NewAntennasImages');
const NewRadioUnitsImages = require('../models/NewRadioUnitsImages');
const NewFPFHsImages = require('../models/NewFPFHsImages');
const NewGPSImages = require('../models/NewGPSImages');
const NewMWImage = require('../models/NewMWImage');

const sessionId = '2025-06-10T13:19:14.277Zsite1';

async function diagnoseGalleryData() {
  console.log('🔍 Diagnosing Gallery Data for Session:', sessionId);
  console.log('=' .repeat(60));

  const models = [
    { name: 'SiteImages', model: SiteImages },
    { name: 'AntennaStructureImages', model: AntennaStructureImages },
    { name: 'AntennaImages', model: AntennaImages },
    { name: 'RadioUnitImages', model: RadioUnitImages },
    { name: 'DCPowerSystemImages', model: DCPowerSystemImages },
    { name: 'OutdoorGeneralLayoutImages', model: OutdoorGeneralLayoutImages },
    { name: 'OutdoorCabinetsImages', model: OutdoorCabinetsImages },
    { name: 'AcConnectionImages', model: AcConnectionImages },
    { name: 'AcPanelImages', model: AcPanelImages },
    { name: 'PowerMeterImages', model: PowerMeterImages },
    { name: 'MWAntennasImages', model: MWAntennasImages },
    { name: 'TransmissionMWImages', model: TransmissionMWImages },
    { name: 'RANEquipmentImages', model: RANEquipmentImages },
    { name: 'ExternalDCDistributionImages', model: ExternalDCDistributionImages },
    { name: 'NewAntennasImages', model: NewAntennasImages },
    { name: 'NewRadioUnitsImages', model: NewRadioUnitsImages },
    { name: 'NewFPFHsImages', model: NewFPFHsImages },
    { name: 'NewGPSImages', model: NewGPSImages },
    { name: 'NewMWImage', model: NewMWImage }
  ];

  for (const { name, model } of models) {
    try {
      console.log(`\n📊 Checking ${name}...`);
      
      // Count total records
      const totalCount = await model.count();
      console.log(`   Total records in table: ${totalCount}`);
      
      // Count records for this session
      const sessionCount = await model.count({
        where: { session_id: sessionId }
      });
      console.log(`   Records for session ${sessionId}: ${sessionCount}`);
      
      // Get sample records for this session
      const sampleRecords = await model.findAll({
        where: { session_id: sessionId },
        attributes: ['id', 'session_id', 'image_category', 'original_filename'],
        limit: 3
      });
      
      if (sampleRecords.length > 0) {
        console.log(`   Sample records:`);
        sampleRecords.forEach((record, index) => {
          console.log(`     ${index + 1}. ID: ${record.id}, Category: ${record.image_category}, File: ${record.original_filename}`);
        });
      } else {
        console.log(`   ❌ No records found for this session`);
        
        // Check if there are any records with similar session IDs
        const similarSessions = await model.findAll({
          attributes: ['session_id'],
          where: {
            session_id: {
              [Sequelize.Op.like]: `%${sessionId.split('site')[0]}%`
            }
          },
          limit: 5
        });
        
        if (similarSessions.length > 0) {
          console.log(`   🔍 Found similar session IDs:`);
          similarSessions.forEach((record, index) => {
            console.log(`     ${index + 1}. ${record.session_id}`);
          });
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error checking ${name}:`, error.message);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 Summary:');
  console.log('- If a table shows 0 records for the session, no images were uploaded');
  console.log('- If similar session IDs are found, there might be a format mismatch');
  console.log('- Check the upload forms to ensure images are being saved correctly');
}

// Also check the API response
async function testAPIResponse() {
  console.log('\n🌐 Testing API Response...');
  try {
    const response = await axios.get(`http://localhost:3000/api/gallery/${sessionId}`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    const data = response.data.data;
    
    console.log('\n📈 Sections with images:');
    Object.entries(data.sections).forEach(([sectionKey, section]) => {
      const totalImages = Object.values(section.images).reduce((sum, images) => sum + images.length, 0);
      if (totalImages > 0) {
        console.log(`   ✅ ${section.section_name}: ${totalImages} images`);
        Object.entries(section.images).forEach(([category, images]) => {
          console.log(`      - ${category}: ${images.length} images`);
        });
      } else {
        console.log(`   ❌ ${section.section_name}: 0 images`);
      }
    });
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

async function main() {
  await diagnoseGalleryData();
  await testAPIResponse();
}

main().catch(console.error); 