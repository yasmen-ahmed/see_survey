const axios = require('axios');

async function checkAPISections() {
  try {
    const response = await axios.get('http://localhost:3000/api/gallery/2025-06-10T13:19:14.277Zsite1');
    
    if (response.data.success) {
      const sections = Object.keys(response.data.data.sections);
      console.log('API Sections:', sections);
      console.log('Total sections:', sections.length);
      
      // Check for missing sections
      const expectedSections = [
        'general_site', 'antenna_structure', 'antennas', 'radio_units',
        'dc_power_system', 'outdoor_general_layout', 'outdoor_cabinets',
        'ac_connection', 'ac_panel', 'power_meter', 'mw_antennas',
        'transmission_mw', 'ran_equipment', 'external_dc_distribution',
        'new_antennas', 'new_radio_units', 'new_fpfhs', 'new_gps', 'new_mw'
      ];
      
      const missing = expectedSections.filter(s => !sections.includes(s));
      console.log('Missing sections:', missing);
      
      // Check empty sections
      const emptySections = sections.filter(section => {
        const sectionData = response.data.data.sections[section];
        return Object.keys(sectionData.images).length === 0;
      });
      console.log('Empty sections:', emptySections);
      
    } else {
      console.log('API Error:', response.data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAPISections(); 