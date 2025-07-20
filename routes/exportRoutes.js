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

// Export all site data for a given session_id as Excel
router.get('/site/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

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

    // Load the template
    const templatePath = path.join(__dirname, '../templates/Survey_Report_template_ed1.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    
    // Site Location sheet (transposed)
    const locSheet = workbook.getWorksheet('Implimentation Survey Report');
    if (locSheet) {
      locSheet.getCell('H6').value = siteId || '';
      locSheet.getCell('P6').value = antennaStructure['antenna_structure_data']['gf_antenna_structure_height'] || '';
      locSheet.getCell('W6').value = antennaStructure['antenna_structure_data']['tower_type'] || '';
      locSheet.getCell('H7').value = antennaStructure['antenna_structure_data']['rt_building_height'] || '';
      locSheet.getCell('Q7').value = areaInfo['other_telecom_operator_exist_onsite'] || '';
      locSheet.getCell('W7').value = areaInfo['site_ownership'] || '';
      locSheet.getCell('I9').value = siteImages['image_category']['site_entrance'] || '' // need to check the image dimensions
      locSheet.getCell('G212').value = areaInfo['location_of_existing_telecom_racks_cabinets'] || '';
      locSheet.getCell('G235').value = areaInfo['location_of_planned_new_telecom_racks_cabinets'] || '';
      locSheet.getCell('J80').value = newRadioInstallations['new_radio_units_planned'] || '';
      locSheet.getCell('O89').value = newRadioUnits['connected_to_antenna'] || '';
      locSheet.getCell('O113').value = newAntennas['new_or_swap'] || '';
      locSheet.getCell('I117').value = newAntennas['azimuth_angle_shift'] || '';
      locSheet.getCell('M117').Value = newAntennas['base_height_from_tower']||'';
      locSheet.getCell('M117').Value = newAntennas['antenna_technology']||'';
      locSheet.getCell('J119').Value = newAntennas['side_arm_type']||'';
      locSheet.getCell('L123').value = newRadioUnits['fiber_cable_length'] || '';
      // ...fill other cells as needed
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

module.exports = router; 