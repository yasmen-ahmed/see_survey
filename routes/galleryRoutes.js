const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Import all models
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

const AcConnectionInfo = require('../models/AcConnectionInfo'); 
const PowerMeter = require('../models/PowerMeter');
const OutdoorGeneralLayout = require('../models/OutdoorGeneralLayout');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const RanEquipment = require('../models/RANEquipment');
const TransmissionMW = require('../models/TransmissionMW');
const DCPowerSystem = require('../models/DCPowerSystem');
const MWAntennas = require('../models/MWAntennas');
const ExternalDCDistribution = require('../models/ExternalDCDistribution');
const RadioAntenna = require('../models/AntennaConfiguration');
const RadioUnit = require('../models/RadioUnits');
const NewRadioInstallations =  require('../models/NewRadioInstallations');
const NewMw = require('../models/NewMW');


// Helper function to fetch diesel and related info
async function getDieselInfo(sessionId) {
  const safeQuery = async (model, attributes) => {
    try {
      return await model.findOne({
        where: { session_id: { [Op.eq]: sessionId } },
        attributes,
        raw: true
      });
    } catch {
      return null;
    }
  };

  const acConnectionInfo = await safeQuery(AcConnectionInfo, ['diesel_config']);
  const powerMeter = await safeQuery(PowerMeter, ['ac_power_source_type']);
  const outdoorGeneralLayout = await safeQuery(OutdoorGeneralLayout, ['earth_bus_bar_config', 'free_positions_available']);
  const outdoorCabinets = await safeQuery(OutdoorCabinets, ['number_of_cabinets']);
  const ranEquipment = await safeQuery(RanEquipment, ['ran_equipment']);
  const transmissionMW = await safeQuery(TransmissionMW, ['transmission_data']);
  const dcPowerSystem = await safeQuery(DCPowerSystem, ['dc_power_data']);
  const radioAntenna = await safeQuery(RadioAntenna, ['antenna_count']);
  const radioUnit = await safeQuery(RadioUnit, ['radio_unit_count']);
  const newRadioInstallations = await safeQuery(NewRadioInstallations, ['new_antennas_planned','new_fpfh_installed','new_radio_units_planned']);
  const mwData = await NewMWImage.findAll({
    where: { session_id: sessionId },
    attributes: ['mw_index'],   // just get mw_index
    group: ['mw_index']          // group by mw_index to avoid duplicates
  });
  // Try snake_case first, then camelCase as fallback (models may define either)
  const mwAntennas = await (async () => {
    const snake = await safeQuery(MWAntennas, ['mw_antennas_data']);
    if (snake && Object.prototype.hasOwnProperty.call(snake, 'mw_antennas_data')) return snake;
    const camel = await safeQuery(MWAntennas, ['mwAntennasData']);
    return camel;
  })();

  const externalDCDistribution = await (async () => {
    const snake = await safeQuery(ExternalDCDistribution, ['external_dc_data']);
    if (snake && Object.prototype.hasOwnProperty.call(snake, 'external_dc_data')) return snake;
    const camel = await safeQuery(ExternalDCDistribution, ['externalDCData']);
    return camel;
  })();

  return {
    diesel_count: acConnectionInfo?.diesel_config?.count ?? 0,
    ac_power_source_type: powerMeter?.ac_power_source_type ?? null,
    earth_bus_bar_config: outdoorGeneralLayout?.earth_bus_bar_config?.available_bars ?? 0,
    free_positions_available: outdoorGeneralLayout?.free_positions_available ?? 0,
    number_of_cabinets: outdoorCabinets?.number_of_cabinets ?? 0,
    how_many_base_band_onsite: ranEquipment?.ran_equipment?.how_many_base_band_onsite ?? 0,
    transmission_data: [
      transmissionMW?.transmission_data?.type_of_transmission ?? null,
      transmissionMW?.transmission_data?.how_many_mw_link_exist ?? 0
    ],
    dc_power_data: [
      dcPowerSystem?.dc_power_data?.dc_rectifiers?.how_many_existing_dc_rectifier_modules ?? 0,
      dcPowerSystem?.dc_power_data?.batteries?.how_many_existing_battery_string ?? 0
    ],
    mw_antennas_data: (mwAntennas?.mw_antennas_data || mwAntennas?.mwAntennasData)?.how_many_mw_antennas_on_tower ?? 0,
    external_dc_distribution_data: (externalDCDistribution?.external_dc_data || externalDCDistribution?.externalDCData)?.how_many_dc_pdus ?? 0,
    external_dc_distribution_locations: Array.isArray((externalDCDistribution?.external_dc_data || externalDCDistribution?.externalDCData)?.dc_pdus)
      ? (externalDCDistribution?.external_dc_data || externalDCDistribution?.externalDCData).dc_pdus.map(p => p?.dc_distribution_location ?? null)
      : [],
    radio_unit_count: radioUnit?.radio_unit_count ?? 0,
    antenna_count: radioAntenna?.antenna_count ?? 0,
    new_antennas_planned: newRadioInstallations?.new_antennas_planned ?? 0,
    new_fpfh_installed: newRadioInstallations?.new_fpfh_installed ?? 0,
    new_radio_units_planned: newRadioInstallations?.new_radio_units_planned ?? 0,
    mw_count: mwData?.length ?? 0
  };
}

// Route to fetch gallery data
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const dieselInfo = await getDieselInfo(sessionId);

    const sections = [
      { name: 'General Site Photos', key: 'general_site', model: SiteImages, categoryField: 'image_category', displayName: 'General Site Photos' },
      { name: 'AC Connection', key: 'ac_connection', model: AcConnectionImages, categoryField: 'image_category', displayName: 'AC Connection' },
      { name: 'Power Meter', key: 'power_meter', model: PowerMeterImages, categoryField: 'image_category', displayName: 'Power Meter' },
      { name: 'AC Panel', key: 'ac_panel', model: AcPanelImages, categoryField: 'image_category', displayName: 'AC Panel' },
      { name: 'Antenna Structure', key: 'antenna_structure', model: AntennaStructureImages, categoryField: 'image_category', displayName: 'Antenna Structure' },
      { name: 'Antennas', key: 'antennas', model: AntennaImages, categoryField: 'image_category', displayName: 'Antennas' },
      { name: 'Radio Units', key: 'radio_units', model: RadioUnitImages, categoryField: 'image_category', displayName: 'Radio Units' },
      { name: 'DC Power System', key: 'dc_power_system', model: DCPowerSystemImages, categoryField: 'image_category', displayName: 'DC Power System' },
      { name: 'Outdoor General Layout', key: 'outdoor_general_layout', model: OutdoorGeneralLayoutImages, categoryField: 'image_category', displayName: 'Outdoor General Layout' },
      { name: 'Outdoor Cabinets', key: 'outdoor_cabinets', model: OutdoorCabinetsImages, categoryField: 'image_category', displayName: 'Outdoor Cabinets' },
      { name: 'MW Antennas', key: 'mw_antennas', model: MWAntennasImages, categoryField: 'image_category', displayName: 'MW Antennas' },
      { name: 'Transmission MW', key: 'transmission_mw', model: TransmissionMWImages, categoryField: 'image_category', displayName: 'Transmission MW' },
      { name: 'RAN Equipment', key: 'ran_equipment', model: RANEquipmentImages, categoryField: 'image_category', displayName: 'RAN Equipment' },
      { name: 'External DC Distribution', key: 'external_dc_distribution', model: ExternalDCDistributionImages, categoryField: 'image_category', displayName: 'External DC Distribution' },
      { name: 'New Antennas', key: 'new_antennas', model: NewAntennasImages, categoryField: 'image_category', displayName: 'New Antennas' },
      { name: 'New Radio Units', key: 'new_radio_units', model: NewRadioUnitsImages, categoryField: 'image_category', displayName: 'New Radio Units' },
      { name: 'New FPFHs', key: 'new_fpfhs', model: NewFPFHsImages, categoryField: 'image_category', displayName: 'New FPFHs' },
      { name: 'New GPS', key: 'new_gps', model: NewGPSImages, categoryField: 'image_category', displayName: 'New GPS' },
      { name: 'New MW', key: 'new_mw', model: NewMWImage, categoryField: 'image_category', displayName: 'New MW' }
    ];

    const galleryData = {};

    for (const section of sections) {
      try {
        let attributes = [
          'id', section.categoryField, 'stored_filename', 'file_url',
          'file_size', 'mime_type', 'description', 'created_at'
        ];

        const hasOriginalFilename = [
          'SiteImages', 'AntennaStructureImages', 'AntennaImages', 'RadioUnitImages',
          'DCPowerSystemImages', 'OutdoorGeneralLayoutImages', 'OutdoorCabinetsImages',
          'AcConnectionImages', 'AcPanelImages', 'PowerMeterImages', 'MWAntennasImages',
          'TransmissionMWImages', 'RANEquipmentImages', 'ExternalDCDistributionImages', 'NewMWImage', 
          'NewAntennasImages', 'NewRadioUnitsImages', 'NewFPFHsImages', 'NewGPSImages'
        ];

        if (hasOriginalFilename.includes(section.model.name)) {
          attributes.push('original_filename');
        }

        const images = await section.model.findAll({
          where: { session_id: sessionId, is_active: true },
          attributes,
          order: [['created_at', 'ASC']]
        });

        if (images.length > 0) {
          const groupedImages = {};
          images.forEach(image => {
            const category = image[section.categoryField];
            if (!groupedImages[category]) {
              groupedImages[category] = [];
            }
            groupedImages[category].push({
              id: image.id,
              category,
              original_filename: image.original_filename || image.stored_filename,
              stored_filename: image.stored_filename,
              file_url: image.file_url,
              file_size: image.file_size,
              mime_type: image.mime_type,
              description: image.description,
              created_at: image.created_at,
              upload_date: image.upload_date || image.created_at
            });
          });
          galleryData[section.key] = {
            section_name: section.displayName,
            images: groupedImages
          };
        }
      } catch (err) {
        console.error(`Error fetching images for section ${section.name}:`, err);
      }
    }

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        ...dieselInfo,
        sections: galleryData
      }
    });
  } catch (error) {
    console.error('Error fetching gallery data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery data',
      details: error.message
    });
  }
});


// Get images for a specific section
router.get('/:sessionId/:section', async (req, res) => {
  try {
    const { sessionId, section } = req.params;
    
    // Map section keys to models
    const sectionModels = {
      'general_site': SiteImages,
      'antenna_structure': AntennaStructureImages,
      'antennas': AntennaImages,
      'radio_units': RadioUnitImages,
      'dc_power_system': DCPowerSystemImages,
      'outdoor_general_layout': OutdoorGeneralLayoutImages,
      'outdoor_cabinets': OutdoorCabinetsImages,
      'ac_connection': AcConnectionImages,
      'ac_panel': AcPanelImages,
      'power_meter': PowerMeterImages,
      'mw_antennas': MWAntennasImages,
      'transmission_mw': TransmissionMWImages,
      'ran_equipment': RANEquipmentImages,
      'external_dc_distribution': ExternalDCDistributionImages,
      'new_antennas': NewAntennasImages,
      'new_radio_units': NewRadioUnitsImages,
      'new_fpfhs': NewFPFHsImages,
      'new_gps': NewGPSImages,
      'new_mw': NewMWImage
    };

    const model = sectionModels[section];
    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Invalid section'
      });
    }

    // Define attributes based on model type
    let attributes = [
      'id',
      'image_category',
      'stored_filename',
      'file_url',
      'file_size',
      'mime_type',
      'description',
      'created_at'
    ];

    // Add original_filename for models that have it
    const hasOriginalFilename = [
      'SiteImages', 'AntennaStructureImages', 'AntennaImages', 
      'RadioUnitImages', 'DCPowerSystemImages', 'OutdoorGeneralLayoutImages',
      'OutdoorCabinetsImages', 'AcConnectionImages', 'AcPanelImages',
      'PowerMeterImages', 'MWAntennasImages', 'TransmissionMWImages',
      'RANEquipmentImages', 'ExternalDCDistributionImages', 'NewMWImage'
    ];

    if (hasOriginalFilename.includes(model.name)) {
      attributes.push('original_filename');
    }

    const images = await model.findAll({
      where: {
        session_id: sessionId,
        is_active: true
      },
      attributes: attributes,
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        section: section,
        images: images
      }
    });

  } catch (error) {
    console.error('Error fetching section images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section images',
      details: error.message
    });
  }
});

module.exports = router; 