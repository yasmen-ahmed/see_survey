const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const Survey = require('../models/Survey');
const SiteLocation = require('../models/SiteLocation');
const SiteAccess = require('../models/SiteAccess');
const SiteAreaInfo = require('../models/SiteAreaInfo');
const SiteVisitInfo = require('../models/SiteVisitInfo');

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

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'see-survey-backend';
    workbook.created = new Date();

    // Site Location sheet (transposed)
    const locSheet = workbook.addWorksheet('Site Location');
    const locData = siteLoc ? siteLoc.toJSON() : {};
    const locFields = [
      { label: 'Site ID', key: 'site_id' },
      { label: 'Site Name', key: 'sitename' },
      { label: 'Region', key: 'region' },
      { label: 'City', key: 'city' },
      { label: 'Longitude', key: 'longitude' },
      { label: 'Latitude', key: 'latitude' },
      { label: 'Elevation', key: 'site_elevation' },
      { label: 'Address', key: 'address' }
    ];
    locFields.forEach((field, idx) => {
      const row = idx + 1;
      locSheet.getCell(`A${row}`).value = field.label;
      locSheet.getCell(`B${row}`).value = locData[field.key] != null ? locData[field.key] : '';
    });

    // Site Access sheet (transposed)
    const accessSheet = workbook.addWorksheet('Site Access');
    const accessData = access ? access.toJSON() : {};
    const accessFields = [
      { label: 'Site Access Permission Required', key: 'site_access_permission_required' },
      { label: 'Contact Person Name', key: 'contact_person_name' },
      { label: 'Contact Tel Number', key: 'contact_tel_number' },
      { label: 'Available Access Time', key: 'available_access_time' },
      { label: 'Type of Gated Fence', key: 'type_of_gated_fence' },
      { label: 'Keys Type', key: 'keys_type' },
      { label: 'Stair Lift Height', key: 'stair_lift_height' },
      { label: 'Stair Lift Width', key: 'stair_lift_width' },
      { label: 'Stair Lift Depth', key: 'stair_lift_depth' },
      { label: 'Preferred Time Slot Crane Access', key: 'preferred_time_slot_crane_access' },
      { label: 'Access to Site by Road', key: 'access_to_site_by_road' },
      { label: 'Keys Required', key: 'keys_required' },
      { label: 'Material Accessibility to Site', key: 'material_accessibility_to_site' },
      { label: 'Contact Person Name for Site Key', key: 'contact_person_name_for_site_key' },
      { label: 'Contact Tel Number for Site Key', key: 'contact_tel_number_for_site_key' }
    ];
    accessFields.forEach((field, idx) => {
      const row = idx + 1;
      accessSheet.getCell(`A${row}`).value = field.label;
      accessSheet.getCell(`B${row}`).value = accessData[field.key] != null ? accessData[field.key] : '';
    });

    // Site Area Info sheet (transposed)
    const areaSheet = workbook.addWorksheet('Site Area Info');
    const areaData = areaInfo ? areaInfo.toJSON() : {};
    const areaFields = [
      { label: 'Site Located At', key: 'site_located_at' },
      { label: 'Site Ownership', key: 'site_ownership' },
      { label: 'Shared Site', key: 'shared_site' },
      { label: 'Other Telecom Operators Onsite', key: 'other_telecom_operator_exist_onsite' },
      { label: 'AC Power Sharing', key: 'ac_power_sharing' },
      { label: 'DC Power Sharing', key: 'dc_power_sharing' },
      { label: 'Site Topology', key: 'site_topology' },
      { label: 'Site Type', key: 'site_type' },
      { label: 'Planned Scope', key: 'planned_scope' },
      { label: 'Location of Existing Racks/Cabinets', key: 'location_of_existing_telecom_racks_cabinets' },
      { label: 'Location of Planned Racks/Cabinets', key: 'location_of_planned_new_telecom_racks_cabinets' },
      { label: 'Existing Technology', key: 'existing_technology' }
    ];
    areaFields.forEach((field, idx) => {
      const row = idx + 1;
      areaSheet.getCell(`A${row}`).value = field.label;
      let value = areaData[field.key];
      if (Array.isArray(value)) value = value.join(',');
      areaSheet.getCell(`B${row}`).value = value != null ? value : '';
    });

    // Site Visit Info sheet (transposed - first entry)
    const visitSheet = workbook.addWorksheet('Site Visit Info');
    const visitData = visitInfos.length > 0 ? visitInfos[0].toJSON() : {};
    const visitFields = [
      { label: 'Survey Date', key: 'survey_date' },
      { label: 'Surveyor Name', key: 'surveyor_name' },
      { label: 'Subcontractor Company', key: 'subcontractor_company' },
      { label: 'Surveyor Phone', key: 'surveyor_phone' },
      { label: 'Nokia Rep Name', key: 'nokia_representative_name' },
      { label: 'Nokia Rep Title', key: 'nokia_representative_title' },
      { label: 'Customer Rep Name', key: 'customer_representative_name' },
      { label: 'Customer Rep Title', key: 'customer_representative_title' }
    ];
    visitFields.forEach((field, idx) => {
      const row = idx + 1;
      visitSheet.getCell(`A${row}`).value = field.label;
      visitSheet.getCell(`B${row}`).value = visitData[field.key] != null ? visitData[field.key] : '';
    });

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