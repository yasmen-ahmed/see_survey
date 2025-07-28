const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const path = require('path');
const Survey = require('../models/Survey');
const SiteLocation = require('../models/SiteLocation');
const SiteAccess = require('../models/SiteAccess');
const SiteAreaInfo = require('../models/SiteAreaInfo');
const SiteVisitInfo = require('../models/SiteVisitInfo');
const AntennaStructure = require('../models/AntennaStructure');
const AntennaConfiguration = require('../models/AntennaConfiguration');
const MWAntennas = require('../models/MWAntennas')
const SiteImages = require('../models/SiteImages')
const NewRadioInstallations = require('../models/NewRadioInstallations')
const NewRadioUnits = require('../models/NewRadioUnits')
const NewAntennas = require('../models/NewAntennas')
const RadioUnits=require('../models/RadioUnits')
const AcConnectionInfo = require('../models/AcConnectionInfo')
const PowerMeter=require('../models/PowerMeter')
const DCPowerSystem=require('../models/DCPowerSystem')
const axios = require('axios');
const fs = require('fs');


// Export all site data for a given session_id as Excel
router.get('/site/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    console.log('Exporting site data for session:', session_id);
    // Fetch survey to get site_id
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found for this session' });
    }
    const siteId = survey.site_id;

    // Fetch all data
    const siteLoc = await SiteLocation.findByPk(siteId);
    const access = await SiteAccess.findOne({ where: { session_id } });
    const areaInfo = await SiteAreaInfo.findOne({ where: { session_id } });
    const visitInfos = await SiteVisitInfo.findAll({ where: { session_id } });
    const antennaStructure = await AntennaStructure.findOne({ where: { session_id } });
    const antennaConfig = await AntennaConfiguration.findOne({ where: { session_id } });
    const mw_antennas = await MWAntennas.findOne({ where: { session_id } });
    const siteImages = await SiteImages.findOne({ where: { session_id } });
    const newRadioInstallations = await NewRadioInstallations.findOne({ where: { session_id } });
    const newRadioUnits = await NewRadioUnits.findOne({ where: {session_id} });
    const newAntennas = await NewAntennas.findOne({ where: {session_id} });
    const radioUnits = await RadioUnits.findOne({ where: { session_id } });
    const acConnectionInfo = await AcConnectionInfo.findOne({ where: { session_id } });
    const powerMeter = await PowerMeter.findOne({ where: { session_id } });
    const dcPowerSystem = await DCPowerSystem.findOne({ where: { session_id } });

    // Load the template
    const templatePath = path.join(__dirname, '../templates/Survey_Report_template_ed1.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    
    // Site Location sheet (transposed)
    const locSheet = workbook.getWorksheet('Implimentation Survey Report');
    if (locSheet) {
      locSheet.getCell('H6').value = siteId || '';
      locSheet.getCell('P6').value = antennaStructure ? antennaStructure['antenna_structure_data']['gf_antenna_structure_height'] || '' : '';
      locSheet.getCell('W6').value = antennaStructure ? antennaStructure['antenna_structure_data']['tower_type'] || '' : '';
      locSheet.getCell('H7').value = antennaStructure ? antennaStructure['antenna_structure_data']['rt_building_height'] || '' : '';
      locSheet.getCell('Q7').value = areaInfo ? areaInfo['other_telecom_operator_exist_onsite'] || '' : '';
      locSheet.getCell('W7').value = areaInfo ? areaInfo['site_ownership'] || '' : '';
      //locSheet.getCell('I9').value = siteImages ? siteImages['image_category']['site_entrance'] || '' : '' // need to check the image dimensions
      locSheet.getCell('G212').value = areaInfo ? areaInfo['location_of_existing_telecom_racks_cabinets'] || '' : '';
      locSheet.getCell('G235').value = areaInfo ? areaInfo['location_of_planned_new_telecom_racks_cabinets'] || '' : '';
      locSheet.getCell('J80').value = newRadioInstallations ? newRadioInstallations['new_radio_units_planned'] || '' : '';
      locSheet.getCell('O89').value = newRadioUnits ? JSON.stringify(newRadioUnits['connected_to_antenna']) : '';
      locSheet.getCell('K32').value = antennaConfig ? antennaConfig['antenna_count'] || '' : '';
      locSheet.getCell('K33').value = radioUnits ? radioUnits['radio_unit_count'] || '' : '';
      locSheet.getCell('O113').value = newAntennas ? newAntennas['new_or_swap'] || '' : '';
      locSheet.getCell('I117').value = newAntennas ? newAntennas['azimuth_angle_shift'] || '' : '';
      locSheet.getCell('M117').Value = newAntennas ? newAntennas['base_height_from_tower'] || '' : '';
      locSheet.getCell('M117').Value = newAntennas ? JSON.stringify(newAntennas['antenna_technology'] || '') : '';
      locSheet.getCell('J119').Value = newAntennas ? newAntennas['side_arm_type'] || '' : '';
      locSheet.getCell('L123').value = newRadioUnits ? newRadioUnits['fiber_cable_length'] || '' : '';
      locSheet.getCell('K30').value = mw_antennas ? mw_antennas['mw_antennas_data']['how_many_mw_antennas_on_tower'] || '' : '';
      locSheet.getCell('G31').value = mw_antennas && mw_antennas['mw_antennas_data']
  ? Object.entries(
      mw_antennas['mw_antennas_data']['mw_antennas']?.reduce((acc, item) => {
        const d = item.diameter;
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {})
    )
    .map(([diameter, count]) => `${count}x${diameter}`)
    .join(', ')
  : '';

      // Fill operator names and counts in L24, L25, M24, M25, ... for each operator found in antennaConfig['antennas'].
if (antennaConfig['antennas'] && Array.isArray(antennaConfig['antennas'])) {
  // Count antennas per operator
  const operatorCounts = {};
  antennaConfig['antennas'].forEach(item => {
    const operator = item.operator || '';
    if (!operatorCounts.hasOwnProperty(operator)) {
      operatorCounts[operator] = 0;
    }
    operatorCounts[operator] += 1;
  });
  
  let colCode = 76; // 'L' = 76 in ASCII
  Object.entries(operatorCounts).forEach(([operator, count]) => {
    const col = String.fromCharCode(colCode);
    locSheet.getCell(`${col}24`).value = operator;
    locSheet.getCell(`${col}25`).value = count;
    colCode++;
  });
}
    //locSheet.getCell('I9').value = siteImages ? siteImages['image_category']['site_entrance'] || '' : ''; // need to check the image dimensions
      // Add images from site_images table, column file_url, prefixing with 10.129.10.227:3000/
if (siteImages && siteImages['file_url']) {
  const imageUrl = `http://10.129.10.227:3000/${siteImages['file_url']}`;
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageId = workbook.addImage({
      buffer: Buffer.from(response.data, 'binary'),
      extension: siteImages['file_url'].split('.').pop()
    });
    locSheet.addImage(imageId, {
      tl: { col: 8, row: 8 },
      ext: { width: 100, height: 100 }
    });
  } catch (err) {
    console.error('Failed to fetch image:', err.message);
  }
}
      // ...fill other cells as needed
      // ...fill other cells as needed

}
    const locSheet1 = workbook.getWorksheet('TI & TX & Civil Summary');

    if (locSheet1) {
      locSheet1.getCell('A4').value = siteId || '';
      locSheet1.getCell('B4').value = areaInfo ? areaInfo['site_type'] || '' :  '';
      locSheet1.getCell('C4').value = access ? access['site_access_permission_required'] || '' :  '';
      locSheet1.getCell('D4').value = access ? access['contact_tel_number'] || '' :  '';
      locSheet1.getCell('E4').value = access ? access['material_accessibility_to_site'] || '' :  '';
      locSheet1.getCell('F4').value = areaInfo ? areaInfo['location_of_existing_telecom_racks_cabinets'] || '' :  '';
      locSheet1.getCell('I4').value = areaInfo ? areaInfo['location_of_existing_telecom_racks_cabinets'] || '' :  '';
      locSheet1.getCell('G4').value = areaInfo ? areaInfo['planned_scope'] || '' :  '';
      locSheet1.getCell('BJ4').value = areaInfo ? areaInfo['location_of_planned_new_telecom_racks_cabinets'] || '' :  '';
      locSheet1.getCell('BK4').value = newRadioInstallations? newRadioInstallations['new_radio_units_planned'] || '': '';
    }

    const locSheet2 = workbook.getWorksheet('EM summary');

    if (locSheet2) {
      locSheet2.getCell('A3').value = siteId || '';
      locSheet2.getCell('B3').value = siteLoc? siteLoc['region'] || '':'';
      locSheet2.getCell('D3').value = areaInfo ? areaInfo['planned_scope'] || '' :  '';
      locSheet2.getCell('E3').value = areaInfo ? areaInfo['existing_technology'] || '' :  '';
      locSheet2.getCell('F3').value = areaInfo ? areaInfo['site_type'] || '' :  '';
      locSheet2.getCell('G3').value = areaInfo ? areaInfo['location_of_existing_telecom_racks_cabinets'] || '' :  '';
      locSheet2.getCell('H3').value =  acConnectionInfo? acConnectionInfo['power_sources'] || '' :  '';
      locSheet2.getCell('M3').value = acConnectionInfo['diesel_config'] ? acConnectionInfo['diesel_config']['generators'][0]['capacity'] || '' :  '';
      locSheet2.getCell('K3').value =  powerMeter? powerMeter['ac_power_source_type'] || '' :  '';
      locSheet2.getCell('J3').value = powerMeter ? powerMeter['main_cb_config']['rating'] || '' :  '';
      locSheet2.getCell('N3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['dc_rectifiers']['existing_dc_rectifiers_vendor'] || '' : '';
      locSheet2.getCell('O3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['dc_rectifiers']['how_many_existing_dc_rectifier_modules'] || '' : '';
      locSheet2.getCell('P3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['dc_rectifiers']['how_many_free_slot_available_rectifier'] || '' : '';
      locSheet2.getCell('R3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['dc_rectifiers']['rectifier_module_capacity'] || '' : '';
      locSheet2.getCell('S3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['batteries']['existing_batteries_type'] || '' : '';
      locSheet2.getCell('T3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['batteries']['total_battery_capacity'] || '' : '';
      locSheet2.getCell('U3').value = dcPowerSystem ? dcPowerSystem['dc_power_data']['batteries']['how_many_existing_battery_string'] || '' : '';
    }

    

    
    
    // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="site-export-${session_id}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/report/:session_id', async (req, res) => {
  

  try {
    // Fetch report data based on session_id
    const { session_id } = req.params;
    const reportData = await getReportData(session_id);
    // Fetch survey to get site_id
    const survey = await Survey.findOne({ where: { session_id } });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found for this session' });
    }
    const siteId = survey.site_id;
    // Load the template
    const templatePath = path.join(__dirname, '../templates/Survey_Report_template_ed2.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);


    // Site Location sheet (transposed)
    const locSheet = workbook.getWorksheet('Implimentation Survey Report');
    if (locSheet) {
      locSheet.getCell('H6').value = siteId || '';
      locSheet.getCell('A1').value = session_id || '';
      
    }
    
    // Send report data as JSON response
     // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="site-export-${session_id}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;