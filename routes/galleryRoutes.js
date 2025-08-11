const express = require('express');
const router = express.Router();


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
const { Op } = require('sequelize');
const AcConnectionInfo = require('../models/AcConnectionInfo'); 
const PowerMeter = require('../models/PowerMeter');
const OutdoorGeneralLayout = require('../models/OutdoorGeneralLayout');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const RanEquipment = require('../models/RanEquipment');
 

// Get all images for a session organized by sections
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    async function getDieselInfo(sessionId) {
        try {
          const acConnectionInfo = await AcConnectionInfo.findOne({
            where: {
              session_id: {
                [Op.eq]: sessionId
              }
            },
            attributes: ['diesel_config']
          });
      
          const powerMeter = await PowerMeter.findOne({
            where: {
              session_id: {
                [Op.eq]: sessionId
              }
            },
            attributes: ['ac_power_source_type']
          });

          const outdoorGeneralLayout = await OutdoorGeneralLayout.findOne({
            where: {
              session_id: {
                [Op.eq]: sessionId
              }
            },
            attributes: ['earth_bus_bar_config', 'free_positions_available']
          });

          const outdoorCabinets = await OutdoorCabinets.findOne({
            where: {
              session_id: {
                [Op.eq]: sessionId
              }
            },
            attributes: ['number_of_cabinets']
          });
          const ranEquipment = await RanEquipment.findOne({
            where: {
              session_id: {
                [Op.eq]: sessionId
              }
            },
            attributes: ['ran_equipment']
          });
          const dieselCount = acConnectionInfo?.diesel_config?.count ?? 0;
          const acPowerSourceType = powerMeter?.ac_power_source_type ?? null;
          const earthBusBarConfig = outdoorGeneralLayout?.earth_bus_bar_config?.available_bars ?? 0;
          const freePositionsAvailable = outdoorGeneralLayout?.free_positions_available ?? 0;
          const numberOfCabinets = outdoorCabinets?.number_of_cabinets ?? 0;
          const how_many_base_band_onsite = ranEquipment?.ran_equipment?.how_many_base_band_onsite ?? 0;
          return { dieselCount, acPowerSourceType, earthBusBarConfig, freePositionsAvailable, numberOfCabinets, how_many_base_band_onsite };
        } catch (error) {
          console.error('Error fetching info:', error);
            return { dieselCount: 0, acPowerSourceType: 0, earthBusBarConfig: 0, freePositionsAvailable: 0, numberOfCabinets: 0 ,how_many_base_band_onsite: 0};
        }
      }
      
      // Usage example:
      const { dieselCount, acPowerSourceType, earthBusBarConfig, freePositionsAvailable, numberOfCabinets, how_many_base_band_onsite } = await getDieselInfo(sessionId);
      
    
    // Define sections with their models and display names
    const sections = [
      {
        name: 'General Site Photos',
        key: 'general_site',
        model: SiteImages,
        categoryField: 'image_category',
        displayName: 'General Site Photos'
      },
      {
        name: 'AC Connection',
        key: 'ac_connection',
        model: AcConnectionImages,
        categoryField: 'image_category',
        displayName: 'AC Connection'
      },
    
      {
        name: 'Power Meter',
        key: 'power_meter',
        model: PowerMeterImages,
        categoryField: 'image_category',
        displayName: 'Power Meter'
      },
        {
        name: 'AC Panel',
        key: 'ac_panel',
        model: AcPanelImages,
        categoryField: 'image_category',
        displayName: 'AC Panel'
      },
      {
        name: 'Antenna Structure',
        key: 'antenna_structure',
        model: AntennaStructureImages,
        categoryField: 'image_category',
        displayName: 'Antenna Structure'
      },
      {
        name: 'Antennas',
        key: 'antennas',
        model: AntennaImages,
        categoryField: 'image_category',
        displayName: 'Antennas'
      },
      {
        name: 'Radio Units',
        key: 'radio_units',
        model: RadioUnitImages,
        categoryField: 'image_category',
        displayName: 'Radio Units'
      },
      {
        name: 'DC Power System',
        key: 'dc_power_system',
        model: DCPowerSystemImages,
        categoryField: 'image_category',
        displayName: 'DC Power System'
      },
      {
        name: 'Outdoor General Layout',
        key: 'outdoor_general_layout',
        model: OutdoorGeneralLayoutImages,
        categoryField: 'image_category',
        displayName: 'Outdoor General Layout'
      },
      {
        name: 'Outdoor Cabinets',
        key: 'outdoor_cabinets',
        model: OutdoorCabinetsImages,
        categoryField: 'image_category',
        displayName: 'Outdoor Cabinets'
      },
      
      {
        name: 'MW Antennas',
        key: 'mw_antennas',
        model: MWAntennasImages,
        categoryField: 'image_category',
        displayName: 'MW Antennas'
      },
      {
        name: 'Transmission MW',
        key: 'transmission_mw',
        model: TransmissionMWImages,
        categoryField: 'image_category',
        displayName: 'Transmission MW'
      },
      {
        name: 'RAN Equipment',
        key: 'ran_equipment',
        model: RANEquipmentImages,
        categoryField: 'image_category',
        displayName: 'RAN Equipment'
      },
      {
        name: 'External DC Distribution',
        key: 'external_dc_distribution',
        model: ExternalDCDistributionImages,
        categoryField: 'image_category',
        displayName: 'External DC Distribution'
      },
      {
        name: 'New Antennas',
        key: 'new_antennas',
        model: NewAntennasImages,
        categoryField: 'image_category',
        displayName: 'New Antennas'
      },
      {
        name: 'New Radio Units',
        key: 'new_radio_units',
        model: NewRadioUnitsImages,
        categoryField: 'image_category',
        displayName: 'New Radio Units'
      },
      {
        name: 'New FPFHs',
        key: 'new_fpfhs',
        model: NewFPFHsImages,
        categoryField: 'image_category',
        displayName: 'New FPFHs'
      },
      {
        name: 'New GPS',
        key: 'new_gps',
        model: NewGPSImages,
        categoryField: 'image_category',
        displayName: 'New GPS'
      },
      {
        name: 'New MW',
        key: 'new_mw',
        model: NewMWImage,
        categoryField: 'image_category',
        displayName: 'New MW'
      }
    ];

    const galleryData = {};

    // Fetch images for each section
    for (const section of sections) {
      try {
        // Define attributes based on model type
        let attributes = [
          'id',
          section.categoryField,
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

        if (hasOriginalFilename.includes(section.model.name)) {
          attributes.push('original_filename');
        }

        const images = await section.model.findAll({
          where: {
            session_id: sessionId,
            is_active: true
          },
          attributes: attributes,
          order: [['created_at', 'ASC']]
        });

        if (images.length > 0) {
          // Group images by category
          const groupedImages = {};
          images.forEach(image => {
            const category = image[section.categoryField];
            if (!groupedImages[category]) {
              groupedImages[category] = [];
            }
            
            // Format image data
            const imageData = {
              id: image.id,
              category: category,
              original_filename: image.original_filename || image.stored_filename,
              stored_filename: image.stored_filename,
              file_url: image.file_url,
              file_size: image.file_size,
              mime_type: image.mime_type,
              description: image.description,
              created_at: image.created_at,
              upload_date: image.upload_date || image.created_at
            };
            
            groupedImages[category].push(imageData);
          });

          galleryData[section.key] = {
            section_name: section.displayName,
            images: groupedImages
          };
        }
      } catch (error) {
        console.error(`Error fetching images for section ${section.name}:`, error);
        // Continue with other sections even if one fails
      }
    }

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        diesel_count: dieselCount,
        ac_power_source_type: acPowerSourceType,
        earth_bus_bar_config: earthBusBarConfig,
        free_positions_available: freePositionsAvailable,
        number_of_cabinets: numberOfCabinets,
        how_many_base_band_onsite: how_many_base_band_onsite,
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