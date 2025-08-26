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
const Ran_equipment=require('../models/RANEquipment') // Assuming this is the correct path for Ran_equipment model
const axios = require('axios');
const fs = require('fs');


// Export to new SE TSSR template
router.get('/tssr/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    console.log('Exporting to SE TSSR template for session:', session_id);
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
    const Ran_equipment = await Ran_equipment.findOne({ where: { session_id } });
    
    
    // Load the new template
    const templatePath = path.join(__dirname, '../templates/SE_TSSR_template.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Cover Page sheet
    const coverSheet = workbook.getWorksheet('Cover Page');
    if (coverSheet) {
      coverSheet.getCell('B6').value = survey.project || '';
      coverSheet.getCell('B8').value = siteLoc.sitename || '';
      coverSheet.getCell('B10').value = siteId || '';
      coverSheet.getCell('B12').value = areaInfo.planned_scope || '';
      coverSheet.getCell('B14').value = siteLoc.region || '';
      coverSheet.getCell('B16').value = siteLoc.city || '';
      coverSheet.getCell('B18').value = `${siteLoc.latitude || ''}, ${siteLoc.longitude || ''}`;
      // Site Address in B20 - assuming generated from coordinates, but no tool, leave blank
      coverSheet.getCell('B20').value = ''; // TODO: if possible, generate address
    }

    // Site Info sheet
    const siteInfoSheet = workbook.getWorksheet('Site Info');
    if (siteInfoSheet) {
      siteInfoSheet.getCell('C3').value = survey.ct || '';
      siteInfoSheet.getCell('D6').value = survey.project || '';
      siteInfoSheet.getCell('D7').value = siteLoc.sitename || '';
      siteInfoSheet.getCell('D8').value = areaInfo.existing_technology || '';
      siteInfoSheet.getCell('D9').value = siteLoc.site_topology || '';
      siteInfoSheet.getCell('D10').value = siteLoc.site_located_at || ''; // assuming field exists
      siteInfoSheet.getCell('D11').value = areaInfo.site_type || '';

      // Sharing Information
      // Assuming site ownership and shared site
      siteInfoSheet.getCell('B18').value = areaInfo.site_ownership || '';
      siteInfoSheet.getCell('J18').value = areaInfo.other_telecom_operator_exist_onsite || ''; // as shared site yes/no

      siteInfoSheet.getCell('D20').value = areaInfo.other_telecom_operator_exist_onsite || '';

      // Access Information
      siteInfoSheet.getCell('D23').value = access.site_access_permission_required || '';
      // Available Access Time - perhaps from access.available_access_time if exists
      siteInfoSheet.getCell('J23').value = access.available_access_time || '';

      siteInfoSheet.getCell('D24').value = access.contact_person_name || '';
      siteInfoSheet.getCell('L24').value = access.contact_tel_number || '';

      siteInfoSheet.getCell('D25').value = access.site_key_contact || '';
      siteInfoSheet.getCell('L25').value = access.site_key_contact_phone || '';

      siteInfoSheet.getCell('D26').value = access.access_to_site_by_road || '';
      siteInfoSheet.getCell('L26').value = access.type_of_gated_fence || '';

      siteInfoSheet.getCell('D27').value = access.keys_required || '';
      siteInfoSheet.getCell('L27').value = access.keys_type || '';

      siteInfoSheet.getCell('D29').value = access.material_accessibility_to_site || '';

      siteInfoSheet.getCell('D30').value = access.stair_lift_dimensions || ''; // assuming ' ( H X W X D)'

      siteInfoSheet.getCell('D32').value = access.crane_access_time || '';
      siteInfoSheet.getCell('L32').value = access.need_crane_permission || '';

      siteInfoSheet.getCell('O33').value = access.crane_location || '';
      siteInfoSheet.getCell('Q33').value = access.crane_access_to_street || '';

      siteInfoSheet.getCell('D34').value = access.why_crane_needed || '';

      siteInfoSheet.getCell('D36').value = access.access_problem || '';

      siteInfoSheet.getCell('D37').value = access.environment_cultural_problems || '';

      siteInfoSheet.getCell('D38').value = access.aviation_problems || '';

      siteInfoSheet.getCell('D39').value = access.military_problems || '';

      // Photos - assume siteImages.image_category has keys like 'site_entrance', value file_url
      if (siteImages && siteImages.image_category) {
        const categories = siteImages.image_category;
        const addImageToCell = async (category, col, row, width = 200, height = 150) => {
          if (categories[category]) {
            const imageUrl = `http://10.129.10.227:3000/${categories[category]}`;
            try {
              const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
              const imageId = workbook.addImage({
                buffer: Buffer.from(response.data),
                extension: categories[category].split('.').pop()
              });
              siteInfoSheet.addImage(imageId, {
                tl: { col: col - 0.001, row: row - 0.001 }, // slight offset for positioning
                ext: { width, height }
              });
            } catch (err) {
              console.error(`Failed to fetch image for ${category}:`, err.message);
            }
          }
        };

        await addImageToCell('site_entrance', 15, 9);
        await addImageToCell('site_id_picture', 17, 9);
        await addImageToCell('site_map_snapshot', 19, 9);

        await addImageToCell('building_stairs_lift', 18, 17);
        await addImageToCell('roof_entrance', 19, 17);
        await addImageToCell('site_environment_view', 20, 17);

        await addImageToCell('base_station_shelter_room', 18, 25);
        await addImageToCell('site_name_on_shelter_room', 19, 25);
      }
    }

    // Room - Cabinets sheet
    const roomCabinetsSheet = workbook.getWorksheet('Room - Cabinets');
    if (roomCabinetsSheet) {
      // RAN BTS(s)
      // Assuming fields in radioUnits or areaInfo for BTS/cabinet data
      //roomCabinetsSheet.getCell('B5').value = radioUnits.base_band_technology || '';
      roomCabinetsSheet.getCell('B5').value = Ran_equipment.base_band_technology || '';
      roomCabinetsSheet.getCell('B6').value = radioUnits.existing_base_band_located_in_cabinet || '';

      roomCabinetsSheet.getCell('B7').value = radioUnits.base_band_vendor || '';
      roomCabinetsSheet.getCell('B8').value = radioUnits.base_band_model || '';
      roomCabinetsSheet.getCell('B9').value = radioUnits.base_band_status || '';

      roomCabinetsSheet.getCell('B10').value = mw_antennas.transmission_cable_backhouling_type || '';

      roomCabinetsSheet.getCell('B11').value = mw_antennas.length_of_transmission_cable_backhouling || '';

      roomCabinetsSheet.getCell('B12').value = mw_antennas.backholing_destination || '';

      // Cabinets
      roomCabinetsSheet.getCell('B17').value = areaInfo.cabinet_type || '';

      roomCabinetsSheet.getCell('B18').value = areaInfo.cabinet_vendor || '';

      roomCabinetsSheet.getCell('B19').value = areaInfo.cabinet_model || '';

      roomCabinetsSheet.getCell('B20').value = areaInfo.cabinet_has_anti_theft || '';

      roomCabinetsSheet.getCell('B21').value = areaInfo.cooling_type || '';

      roomCabinetsSheet.getCell('B22').value = areaInfo.air_condition_status || '';

      roomCabinetsSheet.getCell('B23').value = areaInfo.cooling_capacity_watt || '';

      roomCabinetsSheet.getCell('B24').value = areaInfo.how_many_compartment || '';

      roomCabinetsSheet.getCell('B25').value = areaInfo.existing_hardware_inside_cabinet || '';

      roomCabinetsSheet.getCell('B26').value = areaInfo.cabinet_has_ac_power_feed_from_main_ac_panel || '';

      roomCabinetsSheet.getCell('B27').value = areaInfo.what_is_the_cb_number_in_the_ac_panel || '';

      roomCabinetsSheet.getCell('B28').value = areaInfo.length_of_power_cable_from_ac_panel_to_cb_inside_cabinet_meter || '';

      roomCabinetsSheet.getCell('B29').value = areaInfo.cross_section_of_power_cable_from_ac_panel_to_cb_inside_cabinet_mm || '';

      roomCabinetsSheet.getCell('B30').value = areaInfo.internal_cabinet_layout_suitable_for_installation_of_new_nokia_base_band || '';

      roomCabinetsSheet.getCell('B31').value = areaInfo.how_many_free_19_u_available_for_telecom_hardware_installation || '';

      // For multiple BTS/Cabinets, if data is in arrays, set in columns G, H, etc.
      // Assuming single for simplicity; extend if needed with loops

      // Photos
      if (siteImages && siteImages.image_category) {
        const categories = siteImages.image_category;
        const addImageToCell = async (category, col, row, width = 200, height = 150) => {
          if (categories[category]) {
            const imageUrl = `http://10.129.10.227:3000/${categories[category]}`;
            try {
              const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
              const imageId = workbook.addImage({
                buffer: Buffer.from(response.data),
                extension: categories[category].split('.').pop()
              });
              roomCabinetsSheet.addImage(imageId, {
                tl: { col: col - 0.001, row: row - 0.001 },
                ext: { width, height }
              });
            } catch (err) {
              console.error(`Failed to fetch image for ${category}:`, err.message);
            }
          }
        };

        await addImageToCell('bts1_front', 15, 10);
        await addImageToCell('bts1_back', 17, 10);
        await addImageToCell('bts1_left_side', 19, 10);
        await addImageToCell('bts1_right_side', 21, 10);

        await addImageToCell('bts1_front', 15, 18); // repeat or specific for cabinet
        await addImageToCell('bts1_back', 17, 18);
        await addImageToCell('bts1_left_side', 19, 18);
        await addImageToCell('bts1_right_side', 21, 18);

        await addImageToCell('bts1_front', 15, 26);
        await addImageToCell('bts1_back', 17, 26);
        await addImageToCell('bts1_left_side', 19, 26);
        await addImageToCell('bts1_right_side', 21, 26);

        // Cabinet photos
        await addImageToCell('cabinet1_photo1', 15, 59);
        await addImageToCell('cabinet1_photo2', 17, 59);
        await addImageToCell('cabinet1_photo3', 19, 59);
        await addImageToCell('cabinet1_photo4', 21, 59);

        await addImageToCell('cabinet2_photo1', 15, 67);
        await addImageToCell('cabinet2_photo2', 17, 67);
        await addImageToCell('cabinet2_photo3', 19, 67);
        await addImageToCell('cabinet2_photo4', 21, 67);

        await addImageToCell('cabinet3_photo1', 15, 75);
        await addImageToCell('cabinet3_photo2', 17, 75);
        await addImageToCell('cabinet3_photo3', 19, 75);
        await addImageToCell('cabinet3_photo4', 21, 75);

        await addImageToCell('cabinet4_photo1', 15, 83);
        await addImageToCell('cabinet4_photo2', 17, 83);
        await addImageToCell('cabinet4_photo3', 19, 83);
        await addImageToCell('cabinet4_photo4', 21, 83);

        await addImageToCell('cabinet5_photo1', 15, 91);
        await addImageToCell('cabinet5_photo2', 17, 91);
        await addImageToCell('cabinet5_photo3', 19, 91);
        await addImageToCell('cabinet5_photo4', 21, 91);
      }
    }

    // MW sheet
    const mwSheet = workbook.getWorksheet('MW');
    if (mwSheet) {
      mwSheet.getCell('D5').value = mw_antennas.type_of_transmission || '';

      mwSheet.getCell('B8').value = mw_antennas.existing_odf_located_in || '';

      mwSheet.getCell('B9').value = mw_antennas.cable_length_from_odf_to_baseband_cm || '';

      mwSheet.getCell('B10').value = mw_antennas.odf_fiber_cable_type || '';

      mwSheet.getCell('B11').value = mw_antennas.how_many_free_ports_on_odf || '';

      // MW IDU and ODU
      if (mw_antennas && mw_antennas.mw_antennas_data && Array.isArray(mw_antennas.mw_antennas_data.mw_antennas)) {
        const mws = mw_antennas.mw_antennas_data.mw_antennas.slice(0, 5);
        mws.forEach((mw, index) => {
          const col = 2 + index + 1; // C=3, D=4, etc.
          // IDU
          mwSheet.getRow(15).getCell(col).value = mw.located_in || '';
          mwSheet.getRow(16).getCell(col).value = mw.mw_equipment_vendor || '';
          mwSheet.getRow(17).getCell(col).value = mw.idu_type || '';
          mwSheet.getRow(18).getCell(col).value = mw.card_type_model || '';
          mwSheet.getRow(19).getCell(col).value = mw.destination_site_id || '';
          mwSheet.getRow(20).getCell(col).value = mw.mw_backhauling_type || '';
          mwSheet.getRow(21).getCell(col).value = mw.how_many_ethernet_port_used || '';
          mwSheet.getRow(22).getCell(col).value = mw.how_many_ethernet_port_free || '';

          // ODU
          mwSheet.getRow(26).getCell(col).value = mw.mw_antenna_height_meter || '';
          mwSheet.getRow(27).getCell(col).value = mw.existing_mw_odu_located_at || '';
          mwSheet.getRow(28).getCell(col).value = mw.mw_antenna_diameter_cm || '';
          mwSheet.getRow(29).getCell(col).value = mw.mw_antenna_azimuth_degree || '';
          mwSheet.getRow(30).getCell(col).value = mw.if_shared_site_mw_antenna_belongs_to_which_operator || '';
          mwSheet.getRow(31).getCell(col).value = mw.far_end_site_id || '';
          mwSheet.getRow(32).getCell(col).value = mw.hop_distance_km || '';
          mwSheet.getRow(33).getCell(col).value = mw.link_capacity || '';
          mwSheet.getRow(34).getCell(col).value = mw.is_any_action_planned_for_mw_unit || '';
        });
      }

      // Photos
      if (siteImages && siteImages.image_category) {
        const addImageToCell = async (category, col, row, width = 200, height = 150) => {
          if (categories[category]) {
            const imageUrl = `http://10.129.10.227:3000/${categories[category]}`;
            try {
              const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
              const imageId = workbook.addImage({
                buffer: Buffer.from(response.data),
                extension: categories[category].split('.').pop()
              });
              mwSheet.addImage(imageId, {
                tl: { col: col - 0.001, row: row - 0.001 },
                ext: { width, height }
              });
            } catch (err) {
              console.error(`Failed to fetch image for ${category}:`, err.message);
            }
          }
        };

        await addImageToCell('mw_idu_photo1', 15, 11);
        await addImageToCell('mw_idu_cards_photo1', 17, 11);

        await addImageToCell('mw_idu_photo2', 15, 19);
        await addImageToCell('mw_idu_cards_photo2', 17, 19);

        await addImageToCell('mw_idu_photo3', 15, 27);
        await addImageToCell('mw_idu_cards_photo3', 17, 27);

        await addImageToCell('mw_idu_photo4', 15, 36);
        await addImageToCell('mw_idu_cards_photo4', 17, 36);

        await addImageToCell('mw_idu_photo5', 15, 45);
        await addImageToCell('mw_idu_cards_photo5', 17, 45);

        await addImageToCell('mw_odu1_photo', 15, 53);
        await addImageToCell('mw_odu1_azimuth_view', 17, 53);
        await addImageToCell('mw_odu1_label', 19, 53);

        await addImageToCell('mw_odu2_photo', 15, 61);
        await addImageToCell('mw_odu2_azimuth_view', 17, 61);
        await addImageToCell('mw_odu2_label', 19, 61);

        await addImageToCell('mw_odu3_photo', 15, 69);
        await addImageToCell('mw_odu3_azimuth_view', 17, 69);
        await addImageToCell('mw_odu3_label', 19, 69);

        await addImageToCell('mw_odu4_photo', 15, 77);
        await addImageToCell('mw_odu4_azimuth_view', 17, 77);
        await addImageToCell('mw_odu4_label', 19, 77);

        await addImageToCell('mw_odu5_photo', 15, 85);
        await addImageToCell('mw_odu5_azimuth_view', 17, 85);
        await addImageToCell('mw_odu5_label', 19, 85);
      }
    }

    // Power V1 and V2 sheets - similar structure
    const fillPowerSheet = async (sheet, isV1 = true) => {
      if (sheet) {
        sheet.getCell('B5').value = acConnectionInfo.power_sources || '';

        sheet.getCell('B6').value = powerMeter.ac_power_source_type || '';

        sheet.getCell('B8').value = powerMeter.power_meter_serial_number || '';
        sheet.getCell('G8').value = powerMeter.meter_reading || '';

        sheet.getCell('B9').value = powerMeter.power_meter_cable_length_meters || '';
        sheet.getCell('G9').value = powerMeter.cross_section_mm2 || '';

        sheet.getCell('B10').value = powerMeter.main_cb_config.rating || '';
        sheet.getCell('G10').value = powerMeter.main_cb_config.type || '';

        sheet.getCell('B13').value = acConnectionInfo.transformer_capacity_kva || '';

        sheet.getCell('C18').value = acConnectionInfo.phase1_voltage || '';
        sheet.getCell('D18').value = acConnectionInfo.phase2_voltage || '';
        sheet.getCell('E18').value = acConnectionInfo.phase3_voltage || '';

        sheet.getCell('C19').value = acConnectionInfo.phase1_current || '';
        sheet.getCell('D19').value = acConnectionInfo.phase2_current || '';
        sheet.getCell('E19').value = acConnectionInfo.phase3_current || '';

        sheet.getCell('C20').value = acConnectionInfo.phase1_current_sharing || '';
        sheet.getCell('D20').value = acConnectionInfo.phase2_current_sharing || '';
        sheet.getCell('E20').value = acConnectionInfo.phase3_current_sharing || '';

        sheet.getCell('C23').value = acConnectionInfo.l1l2_voltage || '';
        sheet.getCell('D23').value = acConnectionInfo.l1l3_voltage || '';
        sheet.getCell('E23').value = acConnectionInfo.l2l3_voltage || '';

        sheet.getCell('G23').value = acConnectionInfo.earthing_to_neutral_voltage || '';

        sheet.getCell('B27').value = acConnectionInfo.length_of_power_cable_m || '';
        sheet.getCell('G27').value = acConnectionInfo.cross_section_mm2 || '';

        sheet.getCell('B28').value = acConnectionInfo.main_cb_rating_a || '';
        sheet.getCell('G28').value = acConnectionInfo.main_cb_type || '';

        sheet.getCell('B29').value = acConnectionInfo.does_ac_panel_have_free_cbs || '';
        sheet.getCell('G29').value = acConnectionInfo.free_space_for_new_ac_cbs || '';

        // AC panel CBs
        if (acConnectionInfo && Array.isArray(acConnectionInfo.ac_panel_cbs)) {
          acConnectionInfo.ac_panel_cbs.slice(0, isV1 ? 72 : 38).forEach((cb, index) => { // adjust based on truncation
            const row = 35 + index;
            sheet.getCell(`B${row}`).value = `CB #${index + 1}`;
            sheet.getCell(`C${row}`).value = cb.cb_fuse_rating_amp || '';
            sheet.getCell(`D${row}`).value = cb.load_name || '';
          });
        }

        // DC Rectifiers and Batteries
        if (dcPowerSystem && dcPowerSystem.dc_power_data) {
          const rect = dcPowerSystem.dc_power_data.dc_rectifiers;
          sheet.getCell('B44').value = rect.existing_dc_rectifiers_vendor || '';
          sheet.getCell('B45').value = rect.how_many_existing_dc_rectifier_modules || '';
          sheet.getCell('B46').value = rect.how_many_free_slot_available_rectifier || '';
          sheet.getCell('B47').value = rect.rectifier_module_capacity || '';

          const batt = dcPowerSystem.dc_power_data.batteries;
          sheet.getCell('B50').value = batt.existing_batteries_type || '';
          sheet.getCell('B51').value = batt.total_battery_capacity || '';
          sheet.getCell('B52').value = batt.how_many_existing_battery_string || '';

          sheet.getCell('B55').value = acConnectionInfo.diesel_config ? acConnectionInfo.diesel_config.generators[0].capacity : '';
          // ... add more as per fields
        }

        // DC PDUs
        // Similar loops for BLVD, LLVD, PDU for cabinets, external
        // For example, cabinet1 BLVD CBs
        if (dcPowerSystem && dcPowerSystem.dc_power_data && Array.isArray(dcPowerSystem.dc_power_data.dc_pdus)) {
          // Parse and set accordingly
          // This may require custom mapping based on data structure
        }

        // Photos
        if (siteImages && siteImages.image_category) {
          const addImageToCell = async (category, col, row, width = 200, height = 150) => {
            if (categories[category]) {
              const imageUrl = `http://10.129.10.227:3000/${categories[category]}`;
              try {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imageId = workbook.addImage({
                  buffer: Buffer.from(response.data),
                  extension: categories[category].split('.').pop()
                });
                sheet.addImage(imageId, {
                  tl: { col: col - 0.001, row: row - 0.001 },
                  ext: { width, height }
                });
              } catch (err) {
                console.error(`Failed to fetch image for ${category}:`, err.message);
              }
            }
          };

          await addImageToCell('power_meter_overview', 15, 10);
          await addImageToCell('power_meter_zoomed', 17, 10);
          await addImageToCell('power_meter_cb', 19, 10);
          await addImageToCell('power_meter_cable_route', 21, 10);

          await addImageToCell('volt_phase1', 15, 18);
          await addImageToCell('volt_phase2', 17, 18);
          await addImageToCell('volt_phase3', 19, 18);
          await addImageToCell('transformer_name_plate', 21, 18);

          await addImageToCell('current_phase1', 15, 26);
          await addImageToCell('current_phase2', 17, 26);
          await addImageToCell('current_phase3', 19, 26);

          await addImageToCell('current_sharing_phase1', 15, 35);
          await addImageToCell('current_sharing_phase2', 17, 35);
          await addImageToCell('current_sharing_phase3', 19, 35);

          // ... add for free slots, rectifier CB, battery strings, etc. as per row positions
          await addImageToCell('free_slots_rectifier', 15, 112); // example
          await addImageToCell('rectifier_cb_photos', 17, 112);
          await addImageToCell('rectifier_free_cb', 19, 112);

          await addImageToCell('rect_load_current_reading', 15, 120);
          await addImageToCell('existing_site_temperature', 17, 120);
          await addImageToCell('rectifier_manuf_spec', 19, 120);

          await addImageToCell('battery_string_photo1', 15, 128);
          await addImageToCell('battery_string_photo2', 17, 128);
          await addImageToCell('battery_string_photo3', 19, 128);
          await addImageToCell('battery_string_photo4', 21, 128);

          await addImageToCell('battery_model_photo', 15, 136);
          await addImageToCell('battery_cb_photo', 17, 136);

          await addImageToCell('pdu_photos', 15, 144);
          await addImageToCell('pdu_free_cb', 17, 144);
        }
      }
    };

    await fillPowerSheet(workbook.getWorksheet('Power V1'), true);
    await fillPowerSheet(workbook.getWorksheet('Power V2'), false);

    // Radio System sheet
    const radioSheet = workbook.getWorksheet('Radio System');
    if (radioSheet) {
      radioSheet.getCell('D5').value = antennaStructure.antenna_structure_data.tower_type || '';
      radioSheet.getCell('F5').value = antennaStructure.antenna_structure_data.tower_manufacturer || '';

      radioSheet.getCell('B7').value = antennaStructure.antenna_structure_data.gf_antenna_structure_height || '';

      radioSheet.getCell('B8').value = antennaStructure.lightning_system_installed_on_existing_towers || '';

      radioSheet.getCell('B9').value = antennaStructure.how_many_empty_mounts_side_arms || '';

      // Antenna System
      if (antennaConfig && Array.isArray(antennaConfig.antennas)) {
        const ants = antennaConfig.antennas.slice(0, 9);
        ants.forEach((ant, index) => {
          const col = 2 + index + 1; // C=3
          radioSheet.getRow(14).getCell(col).value = ant.operator || '';
          radioSheet.getRow(15).getCell(col).value = ant.antennas_hight || '';
          radioSheet.getRow(16).getCell(col).value = ant.antenna_located_at_tower_leg || '';
          radioSheet.getRow(17).getCell(col).value = ant.antennas_sector || '';
          radioSheet.getRow(18).getCell(col).value = ant.antennas_technology || '';
          radioSheet.getRow(19).getCell(col).value = ant.azimuth || '';
          radioSheet.getRow(20).getCell(col).value = ant.mechanical_tilt_exist || '';
          radioSheet.getRow(21).getCell(col).value = ant.mechanical_tilt_degree || '';
          radioSheet.getRow(22).getCell(col).value = ant.electrical_tilt_degree || '';
          radioSheet.getRow(23).getCell(col).value = ant.ret_connectivity || '';
          radioSheet.getCell(col + '24').value = ant.vendor || '';
          radioSheet.getCell(col + '25').value = ant.is_it_active_antenna || '';
          radioSheet.getCell(col + '26').value = ant.what_is_the_module_name || '';
          radioSheet.getCell(col + '27').value = ant.how_many_fiber_connected_to_base_band || '';
          radioSheet.getCell(col + '28').value = ant.length_of_fiber_to_base_band_meter || '';
          radioSheet.getCell(col + '29').value = ant.if_other_vendor_antenna_model_number || '';
          radioSheet.getCell(col + '30').value = ant.if_other_vendor_antenna_dimensions_length_cm || '';
          radioSheet.getCell(col + '31').value = ant.if_other_vendor_antenna_dimensions_width_cm || '';
          radioSheet.getCell(col + '32').value = ant.if_other_vendor_antenna_dimensions_depth_cm || '';
          radioSheet.getCell(col + '33').value = ant.if_other_vendor_antenna_weight_kg || '';
          radioSheet.getCell(col + '34').value = ant.if_other_vendor_antenna_gain_dbi || '';
          radioSheet.getCell(col + '35').value = ant.if_other_vendor_antenna_horizontal_beam_width || '';
          radioSheet.getCell(col + '36').value = ant.if_other_vendor_antenna_vertical_beam_width || '';
          radioSheet.getCell(col + '37').value = ant.if_other_vendor_antenna_frequency_range_mhz || '';
          radioSheet.getCell(col + '38').value = ant.if_other_vendor_antenna_polarization || '';
          radioSheet.getCell(col + '39').value = ant.if_other_vendor_antenna_port_configuration || '';
          radioSheet.getCell(col + '40').value = ant.if_other_vendor_antenna_connector_type || '';
          // Extend for more if data available
        });
      }

      // RF units
      if (radioUnits && Array.isArray(radioUnits.radio_units)) {
        const rus = radioUnits.radio_units.slice(0, 9);
        rus.forEach((ru, index) => {
          const col = 2 + index + 1;
          radioSheet.getRow(50).getCell(col).value = ru.rf_unit_vendor || '';
          radioSheet.getRow(51).getCell(col).value = ru.model || '';
          radioSheet.getRow(52).getCell(col).value = ru.mount_type || '';
          radioSheet.getRow(53).getCell(col).value = ru.connected_to_which_antenna || '';
          radioSheet.getRow(54).getCell(col).value = ru.how_many_jumper_connected || '';
          radioSheet.getRow(55).getCell(col).value = ru.jumper_length_meter || '';
          radioSheet.getRow(56).getCell(col).value = ru.jumper_diameter_mm || '';
          radioSheet.getRow(57).getCell(col).value = ru.how_many_power_connected || '';
          radioSheet.getRow(58).getCell(col).value = ru.power_cable_length_meter || '';
          radioSheet.getRow(59).getCell(col).value = ru.power_cable_cross_section_mm2 || '';
          radioSheet.getRow(60).getCell(col).value = ru.how_many_fiber_connected || '';
          radioSheet.getRow(61).getCell(col).value = ru.fiber_cable_length_meter || '';
          radioSheet.getRow(62).getCell(col).value = ru.fiber_cable_type || '';
          // Extend for more
        });
      }

      // Photos
      if (siteImages && siteImages.image_category) {
        const addImageToCell = async (category, col, row, width = 200, height = 150) => {
          if (categories[category]) {
            const imageUrl = `http://10.129.10.227:3000/${categories[category]}`;
            try {
              const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
              const imageId = workbook.addImage({
                buffer: Buffer.from(response.data),
                extension: categories[category].split('.').pop()
              });
              radioSheet.addImage(imageId, {
                tl: { col: col - 0.001, row: row - 0.001 },
                ext: { width, height }
              });
            } catch (err) {
              console.error(`Failed to fetch image for ${category}:`, err.message);
            }
          }
        };

        await addImageToCell('structure_general', 15, 10);
        await addImageToCell('structure_legs_photo1', 17, 10);
        await addImageToCell('structure_legs_photo2', 19, 10);
        await addImageToCell('structure_legs_photo3', 21, 10);
        await addImageToCell('structure_legs_photo4', 23, 10);
        await addImageToCell('tower_manuf_spec', 25, 10);

        await addImageToCell('tower_picture_angle1', 15, 18);
        await addImageToCell('tower_picture_angle2', 17, 18);
        await addImageToCell('tower_picture_angle3', 19, 18);
        await addImageToCell('tower_ladder_and_cables1', 21, 18);
        await addImageToCell('tower_ladder_and_cables2', 23, 18);
        await addImageToCell('lightening_rode', 25, 18);

        await addImageToCell('tower_pic_top', 15, 26);
        await addImageToCell('tower_pic_bottom', 17, 26);
        await addImageToCell('tower_additional_picture1', 19, 26);
        await addImageToCell('tower_additional_picture2', 21, 26);
        await addImageToCell('tower_additional_picture3', 23, 26);
        await addImageToCell('tower_additional_picture4', 25, 26);

        // Antenna photos, assuming categories like 'antenna1_photo', etc.
        for (let i = 1; i <= 9; i++) {
          const row = 42 + (i - 1) * 8; // assuming 8 rows per antenna
          await addImageToCell(`antenna${i}_photo`, 15, row);
          await addImageToCell(`antenna${i}_mount`, 17, row);
          await addImageToCell(`antenna${i}_label`, 19, row);
          await addImageToCell(`antenna${i}_jumper_ports`, 21, row);
          await addImageToCell(`antenna${i}_ret_ports`, 23, row);
          await addImageToCell(`antenna${i}_manuf_spec`, 25, row);
        }

        // RF photos
        for (let i = 1; i <= 9; i++) {
          const row = 136 + (i - 1) * 8; // from row136 for #1, 144 #2, etc.
          await addImageToCell(`rf${i}_and_its_mount`, 15, row);
          await addImageToCell(`rf${i}_label`, 17, row);
          await addImageToCell(`rf${i}_jumper_ports`, 19, row);
          await addImageToCell(`rf${i}_fiber_ports`, 21, row);
          await addImageToCell(`rf${i}_power_ports`, 23, row);
        }
      }
    }

    // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="se-tssr-export-${session_id}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;