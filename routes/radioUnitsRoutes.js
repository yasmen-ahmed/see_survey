const express = require('express');
const router = express.Router();
const RadioUnits = require('../models/RadioUnits');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const ExternalDCDistribution = require('../models/ExternalDCDistribution');

// Validation helper for radio unit data
const validateRadioUnitData = (radioUnitData) => {
  const validOperators = ['Operator 1', 'Operator 2', 'Operator 3', 'Operator 4'];
  const validTowerLegs = ['A', 'B', 'C', 'D'];
  const validVendors = ['Nokia', 'Huawei', 'Ericsson', 'ZTE', 'Other'];
  const validPorts = ['2', '4', '6', '8', '9'];
  const validYesNo = ['Yes', 'No'];
  const validRadioButtons = ['A', 'B', 'C', 'D'];
  const validFeederTypes = ['7/8 inch', '1-1/4 inch', '1-5/4 inch', '1/2 inch'];
  
  // More flexible DC power source validation - includes both predefined and dynamic values
  const validateDcPowerSource = (source) => {
    if (!source) return true; // Allow empty
    
    // Predefined values
    const predefinedSources = ['Directly from rectifier distribution', 'External DC PDU #1', 'External DC PDU #2'];
    if (predefinedSources.includes(source)) return true;
    
    // Cabinet format: "cabinet_1", "cabinet_2", etc.
    if (/^cabinet_\d+$/.test(source)) return true;
    
    // Cabinet specific format: "cabinet_1_blvd_0", "cabinet_2_pdu_1", etc.
    if (/^cabinet_\d+_(blvd|llvd|pdu)_\d+$/.test(source)) return true;
    
    // External PDU format: "external_pdu_1_main_feed", "pdu_1_rating_0", etc.
    if (/^(external_)?pdu_\d+_(main_feed|rating_\d+)$/.test(source)) return true;
    
    return false;
  };

  // Validate basic fields
  if (radioUnitData.operator && !validOperators.includes(radioUnitData.operator)) {
    throw new Error(`Invalid operator: ${radioUnitData.operator}`);
  }
  
  if (radioUnitData.tower_leg && !validTowerLegs.includes(radioUnitData.tower_leg)) {
    throw new Error(`Invalid tower leg: ${radioUnitData.tower_leg}`);
  }
  
  if (radioUnitData.vendor && !validVendors.includes(radioUnitData.vendor)) {
    throw new Error(`Invalid vendor: ${radioUnitData.vendor}`);
  }
  
  if (radioUnitData.nokia_ports && !validPorts.includes(radioUnitData.nokia_ports)) {
    throw new Error(`Invalid Nokia ports: ${radioUnitData.nokia_ports}`);
  }

  // Validate Nokia port connectivity array
  if (radioUnitData.nokia_port_connectivity && Array.isArray(radioUnitData.nokia_port_connectivity)) {
    radioUnitData.nokia_port_connectivity.forEach((conn, index) => {
      if (conn.sector && (conn.sector < 1 || conn.sector > 5)) {
        throw new Error(`Nokia connectivity ${index + 1}: Sector must be 1-5`);
      }
      if (conn.antenna && (conn.antenna < 1 || conn.antenna > 15)) {
        throw new Error(`Nokia connectivity ${index + 1}: Antenna must be 1-15`);
      }
      if (conn.jumper_length && (isNaN(conn.jumper_length) || conn.jumper_length < 0)) {
        throw new Error(`Nokia connectivity ${index + 1}: Jumper length must be a positive number`);
      }
    });
  }

  // Validate dimensions for other vendors
  if (radioUnitData.vendor === 'Other') {
    ['length', 'width', 'depth'].forEach(dim => {
      if (radioUnitData[`other_${dim}`] && (isNaN(radioUnitData[`other_${dim}`]) || radioUnitData[`other_${dim}`] < 0)) {
        throw new Error(`Invalid ${dim} dimension`);
      }
    });
  }

  // Validate radio buttons and Yes/No fields
  if (radioUnitData.radio_unit_side_arm && !validRadioButtons.includes(radioUnitData.radio_unit_side_arm)) {
    throw new Error(`Invalid radio unit side arm: ${radioUnitData.radio_unit_side_arm}`);
  }

  if (radioUnitData.feeder_type && !validFeederTypes.includes(radioUnitData.feeder_type)) {
    throw new Error(`Invalid feeder type: ${radioUnitData.feeder_type}`);
  }

  // Enhanced DC power source validation
  if (radioUnitData.dc_power_source && !validateDcPowerSource(radioUnitData.dc_power_source)) {
    throw new Error(`Invalid DC power source: ${radioUnitData.dc_power_source}. Expected formats: "cabinet_1", "cabinet_1_blvd_0", "external_pdu_1_main_feed", or predefined values`);
  }
  
  // Enhanced DC CB/Fuse validation (similar patterns)
  if (radioUnitData.dc_cb_fuse && !validateDcPowerSource(radioUnitData.dc_cb_fuse)) {
    throw new Error(`Invalid DC CB/Fuse: ${radioUnitData.dc_cb_fuse}. Expected formats: "cabinet_1_blvd_0", "external_pdu_1_main_feed", etc.`);
  }
};

// Helper function to get default empty data structure
const getDefaultEmptyData = (sessionId) => {
  return {
    session_id: sessionId,
    radio_unit_count: 1,
    radio_units: [],
    created_at: null,
    updated_at: null
  };
};

// Helper function to get cabinet numbers for dropdown
const getCabinetNumbers = async (sessionId) => {
  try {
    const outdoorCabinets = await OutdoorCabinets.findOne({
      where: { session_id: sessionId },
      attributes: ['number_of_cabinets', 'cabinets']
    });
    
    if (!outdoorCabinets || !outdoorCabinets.number_of_cabinets) {
      return [];
    }
    
    const cabinetNumbers = [];
    for (let i = 1; i <= outdoorCabinets.number_of_cabinets; i++) {
      cabinetNumbers.push({
        cabinet_number: i,
        display_text: `Cabinet ${i}`,
        value: `cabinet_${i}`
      });
    }
    
    return cabinetNumbers;
  } catch (error) {
    console.warn(`Could not fetch cabinet numbers for session ${sessionId}:`, error.message);
    return [];
  }
};

// Helper function to get DC CB/Fuse options from External DC Distribution
const getDcCbFuseOptions = async (sessionId) => {
  try {
    const externalDc = await ExternalDCDistribution.findOne({
      where: { session_id: sessionId },
      attributes: ['dc_pdus']
    });
    
    const outdoorCabinets = await OutdoorCabinets.findOne({
      where: { session_id: sessionId },
      attributes: ['cabinets']
    });
    
    const options = [];
    
    // Add External DC PDU options
    if (externalDc && externalDc.dc_pdus && Array.isArray(externalDc.dc_pdus)) {
      externalDc.dc_pdus.forEach((pdu, index) => {
        if (pdu.dc_feed_cb_fuse) {
          options.push({
            source: 'External DC PDU',
            pdu_number: index + 1,
            cb_fuse: pdu.dc_feed_cb_fuse,
            display_text: `External DC PDU #${index + 1} - ${pdu.dc_feed_cb_fuse}`,
            value: `external_pdu_${index + 1}_${pdu.dc_feed_cb_fuse}`,
            cabinet_ref: pdu.dc_feed_cabinet || '',
            model: pdu.dc_distribution_model || ''
          });
        }
      });
    }
    
    // Add Cabinet BLVD/LLVD/PDU options
    if (outdoorCabinets && outdoorCabinets.cabinets && Array.isArray(outdoorCabinets.cabinets)) {
      outdoorCabinets.cabinets.forEach((cabinet, cabinetIndex) => {
        const cabinetNumber = cabinetIndex + 1;
        
        // BLVD options
        if (cabinet.blvdCBsRatings && Array.isArray(cabinet.blvdCBsRatings)) {
          cabinet.blvdCBsRatings.forEach((blvd, blvdIndex) => {
            if (blvd.rating && blvd.connected_load) {
              options.push({
                source: 'Cabinet BLVD',
                cabinet_number: cabinetNumber,
                distribution_type: 'BLVD',
                distribution_index: blvdIndex,
                rating: blvd.rating,
                connected_load: blvd.connected_load,
                display_text: `Cabinet ${cabinetNumber} - BLVD ${blvdIndex + 1} (${blvd.rating}A, ${blvd.connected_load})`,
                value: `cabinet_${cabinetNumber}_blvd_${blvdIndex}`
              });
            }
          });
        }
        
        // LLVD options
        if (cabinet.llvdCBsRatings && Array.isArray(cabinet.llvdCBsRatings)) {
          cabinet.llvdCBsRatings.forEach((llvd, llvdIndex) => {
            if (llvd.rating && llvd.connected_load) {
              options.push({
                source: 'Cabinet LLVD',
                cabinet_number: cabinetNumber,
                distribution_type: 'LLVD',
                distribution_index: llvdIndex,
                rating: llvd.rating,
                connected_load: llvd.connected_load,
                display_text: `Cabinet ${cabinetNumber} - LLVD ${llvdIndex + 1} (${llvd.rating}A, ${llvd.connected_load})`,
                value: `cabinet_${cabinetNumber}_llvd_${llvdIndex}`
              });
            }
          });
        }
        
        // PDU options
        if (cabinet.pduCBsRatings && Array.isArray(cabinet.pduCBsRatings)) {
          cabinet.pduCBsRatings.forEach((pdu, pduIndex) => {
            if (pdu.rating && pdu.connected_load) {
              options.push({
                source: 'Cabinet PDU',
                cabinet_number: cabinetNumber,
                distribution_type: 'PDU',
                distribution_index: pduIndex,
                rating: pdu.rating,
                connected_load: pdu.connected_load,
                display_text: `Cabinet ${cabinetNumber} - PDU ${pduIndex + 1} (${pdu.rating}A, ${pdu.connected_load})`,
                value: `cabinet_${cabinetNumber}_pdu_${pduIndex}`
              });
            }
          });
        }
      });
    }
    
    return options;
  } catch (error) {
    console.warn(`Could not fetch DC CB/Fuse options for session ${sessionId}:`, error.message);
    return [];
  }
};

// Helper function to get all External DC PDU ratings data
const getExternalDcPduRatings = async (sessionId) => {
  try {
    const externalDc = await ExternalDCDistribution.findOne({
      where: { session_id: sessionId },
      attributes: ['dc_pdus']
    });
    
    const pduRatings = [];
    
    if (externalDc && externalDc.dc_pdus && Array.isArray(externalDc.dc_pdus)) {
      externalDc.dc_pdus.forEach((pdu, index) => {
        // Get all ratings from the PDU
        const pduData = {
          pdu_number: index + 1,
          pdu_id: `pdu_${index + 1}`,
          dc_distribution_model: pdu.dc_distribution_model || '',
          dc_distribution_location: pdu.dc_distribution_location || '',
          dc_feed_distribution_type: pdu.dc_feed_distribution_type || '',
          dc_feed_cabinet: pdu.dc_feed_cabinet || '',
          dc_feed_cb_fuse: pdu.dc_feed_cb_fuse || '',
          dc_feed_cable_length: pdu.dc_feed_cable_length || 0,
          dc_feed_cable_cross_section: pdu.dc_feed_cable_cross_section || 0,
          is_shared_panel: pdu.is_shared_panel || '',
          has_free_cbs_fuses: pdu.has_free_cbs_fuses || '',
          ratings: []
        };
        
        // If the PDU has CB/Fuse ratings data, include it
        if (pdu.cb_fuse_ratings && Array.isArray(pdu.cb_fuse_ratings)) {
          pdu.cb_fuse_ratings.forEach((rating, ratingIndex) => {
            pduData.ratings.push({
              rating_index: ratingIndex,
              rating_value: rating.rating || '',
              rating_type: rating.type || '',
              connected_load: rating.connected_load || '',
              display_text: `${rating.type || 'CB/Fuse'} ${rating.rating || 'N/A'}${rating.connected_load ? ` (${rating.connected_load})` : ''}`,
              value: `pdu_${index + 1}_rating_${ratingIndex}`
            });
          });
        }
        
        // Add main CB/Fuse info as primary rating
        if (pdu.dc_feed_cb_fuse) {
          pduData.ratings.unshift({
            rating_index: -1,
            rating_value: pdu.dc_feed_cb_fuse,
            rating_type: 'Main Feed',
            connected_load: '',
            display_text: `Main Feed - ${pdu.dc_feed_cb_fuse}`,
            value: `pdu_${index + 1}_main_feed`,
            is_main: true
          });
        }
        
        pduRatings.push(pduData);
      });
    }
    
    return pduRatings;
  } catch (error) {
    console.warn(`Could not fetch External DC PDU ratings for session ${sessionId}:`, error.message);
    return [];
  }
};

// GET /api/radio-units/:session_id
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Try to find existing data
    let radioUnits = await RadioUnits.findOne({
      where: { session_id }
    });
    
    // If no data exists, return default empty structure
    if (!radioUnits) {
      const defaultData = getDefaultEmptyData(session_id);
      return res.json(defaultData);
    }
    
    res.json(radioUnits.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/radio-units/relations/:session_id
// Returns cabinet numbers and DC CB/Fuse options for dropdowns
router.get('/relations/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [cabinetNumbers, dcCbFuseOptions, externalDcPduRatings] = await Promise.all([
      getCabinetNumbers(session_id),
      getDcCbFuseOptions(session_id),
      getExternalDcPduRatings(session_id)
    ]);
    
    res.json({
      session_id,
      cabinet_numbers: cabinetNumbers,
      dc_cb_fuse_options: dcCbFuseOptions,
      external_dc_pdu_ratings: externalDcPduRatings,
      metadata: {
        total_cabinets: cabinetNumbers.length,
        total_dc_options: dcCbFuseOptions.length,
        total_pdu_ratings: externalDcPduRatings.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching radio units relations:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/radio-units/cabinet-dc-options/:session_id/:cabinet_number
// Returns DC CB/Fuse options for a specific cabinet
router.get('/cabinet-dc-options/:session_id/:cabinet_number', async (req, res) => {
  try {
    const { session_id, cabinet_number } = req.params;
    const cabinetNum = parseInt(cabinet_number);
    
    if (isNaN(cabinetNum) || cabinetNum < 1) {
      return res.status(400).json({ error: 'Invalid cabinet number' });
    }
    
    const [outdoorCabinets, externalDc] = await Promise.all([
      OutdoorCabinets.findOne({
        where: { session_id },
        attributes: ['cabinets']
      }),
      ExternalDCDistribution.findOne({
        where: { session_id },
        attributes: ['dc_pdus']
      })
    ]);
    
    if (!outdoorCabinets || !outdoorCabinets.cabinets) {
      return res.json({
        session_id,
        cabinet_number: cabinetNum,
        dc_options: [],
        external_dc_pdu_ratings: []
      });
    }
    
    const cabinetIndex = cabinetNum - 1;
    const cabinet = outdoorCabinets.cabinets[cabinetIndex];
    
    if (!cabinet) {
      return res.status(404).json({ error: `Cabinet ${cabinetNum} not found` });
    }
    
    const dcOptions = [];
    
    // BLVD options from cabinet
    if (cabinet.blvdCBsRatings && Array.isArray(cabinet.blvdCBsRatings)) {
      cabinet.blvdCBsRatings.forEach((blvd, blvdIndex) => {
        if (blvd.rating || blvd.connected_load) {
          dcOptions.push({
            source: 'BLVD',
            distribution_type: 'BLVD',
            distribution_index: blvdIndex,
            field_number: blvdIndex + 1,
            rating: blvd.rating || 0,
            connected_load: blvd.connected_load || '',
            display_text: `BLVD ${blvdIndex + 1} - ${blvd.rating || 0}A${blvd.connected_load ? ` (${blvd.connected_load})` : ''}`,
            value: `cabinet_${cabinetNum}_blvd_${blvdIndex}`
          });
        }
      });
    }
    
    // LLVD options from cabinet
    if (cabinet.llvdCBsRatings && Array.isArray(cabinet.llvdCBsRatings)) {
      cabinet.llvdCBsRatings.forEach((llvd, llvdIndex) => {
        if (llvd.rating || llvd.connected_load) {
          dcOptions.push({
            source: 'LLVD',
            distribution_type: 'LLVD',
            distribution_index: llvdIndex,
            field_number: llvdIndex + 1,
            rating: llvd.rating || 0,
            connected_load: llvd.connected_load || '',
            display_text: `LLVD ${llvdIndex + 1} - ${llvd.rating || 0}A${llvd.connected_load ? ` (${llvd.connected_load})` : ''}`,
            value: `cabinet_${cabinetNum}_llvd_${llvdIndex}`
          });
        }
      });
    }
    
    // PDU options from cabinet
    if (cabinet.pduCBsRatings && Array.isArray(cabinet.pduCBsRatings)) {
      cabinet.pduCBsRatings.forEach((pdu, pduIndex) => {
        if (pdu.rating || pdu.connected_load) {
          dcOptions.push({
            source: 'PDU',
            distribution_type: 'PDU',
            distribution_index: pduIndex,
            field_number: pduIndex + 1,
            rating: pdu.rating || 0,
            connected_load: pdu.connected_load || '',
            display_text: `PDU ${pduIndex + 1} - ${pdu.rating || 0}A${pdu.connected_load ? ` (${pdu.connected_load})` : ''}`,
            value: `cabinet_${cabinetNum}_pdu_${pduIndex}`
          });
        }
      });
    }
    
    // Get External DC PDU ratings filtered by cabinet
    const externalDcPduRatings = [];
    if (externalDc && externalDc.dc_pdus && Array.isArray(externalDc.dc_pdus)) {
      externalDc.dc_pdus.forEach((pdu, index) => {
        // Check if this PDU is related to the selected cabinet
        const isRelatedToCabinet = checkPduCabinetRelation(pdu, cabinetNum);
        
        if (isRelatedToCabinet) {
          const pduData = {
            pdu_number: index + 1,
            pdu_id: `pdu_${index + 1}`,
            dc_distribution_model: pdu.dc_distribution_model || '',
            dc_distribution_location: pdu.dc_distribution_location || '',
            dc_feed_distribution_type: pdu.dc_feed_distribution_type || '',
            dc_feed_cabinet: pdu.dc_feed_cabinet || '',
            dc_feed_cb_fuse: pdu.dc_feed_cb_fuse || '',
            dc_feed_cable_length: pdu.dc_feed_cable_length || 0,
            dc_feed_cable_cross_section: pdu.dc_feed_cable_cross_section || 0,
            is_shared_panel: pdu.is_shared_panel || '',
            has_free_cbs_fuses: pdu.has_free_cbs_fuses || '',
            ratings: [],
            cabinet_relation: getCabinetRelationInfo(pdu, cabinetNum)
          };
          
          // Add main CB/Fuse info as primary rating
          if (pdu.dc_feed_cb_fuse) {
            pduData.ratings.push({
              rating_index: -1,
              rating_value: pdu.dc_feed_cb_fuse,
              rating_type: 'Main Feed',
              connected_load: '',
              display_text: `Main Feed - ${pdu.dc_feed_cb_fuse}`,
              value: `pdu_${index + 1}_main_feed`,
              is_main: true
            });
            
            // Add to dcOptions for dropdown
            dcOptions.push({
              source: 'External DC PDU',
              distribution_type: 'External PDU',
              pdu_number: index + 1,
              rating: pdu.dc_feed_cb_fuse,
              connected_load: 'Main Feed',
              display_text: `External PDU #${index + 1} - ${pdu.dc_feed_cb_fuse} (Main Feed)`,
              value: `external_pdu_${index + 1}_main_feed`
            });
          }
          
          // If the PDU has additional CB/Fuse ratings data, include it
          if (pdu.cb_fuse_ratings && Array.isArray(pdu.cb_fuse_ratings)) {
            pdu.cb_fuse_ratings.forEach((rating, ratingIndex) => {
              pduData.ratings.push({
                rating_index: ratingIndex,
                rating_value: rating.rating || '',
                rating_type: rating.type || '',
                connected_load: rating.connected_load || '',
                display_text: `${rating.type || 'CB/Fuse'} ${rating.rating || 'N/A'}${rating.connected_load ? ` (${rating.connected_load})` : ''}`,
                value: `pdu_${index + 1}_rating_${ratingIndex}`
              });
              
              // Add to dcOptions for dropdown
              dcOptions.push({
                source: 'External DC PDU',
                distribution_type: 'External PDU',
                pdu_number: index + 1,
                rating: rating.rating || 'N/A',
                connected_load: rating.connected_load || '',
                display_text: `External PDU #${index + 1} - ${rating.type || 'CB/Fuse'} ${rating.rating || 'N/A'}${rating.connected_load ? ` (${rating.connected_load})` : ''}`,
                value: `pdu_${index + 1}_rating_${ratingIndex}`
              });
            });
          }
          
          externalDcPduRatings.push(pduData);
        }
      });
    }
    
    res.json({
      session_id,
      cabinet_number: cabinetNum,
      cabinet_name: `Cabinet ${cabinetNum}`,
      dc_options: dcOptions,
      external_dc_pdu_ratings: externalDcPduRatings,
      metadata: {
        cabinet_dc_counts: {
          total_blvd: cabinet.blvdCBsRatings?.length || 0,
          total_llvd: cabinet.llvdCBsRatings?.length || 0,
          total_pdu: cabinet.pduCBsRatings?.length || 0
        },
        external_dc_counts: {
          total_related_pdus: externalDcPduRatings.length,
          total_pdu_ratings: externalDcPduRatings.reduce((sum, pdu) => sum + pdu.ratings.length, 0)
        },
        total_options: dcOptions.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching cabinet DC options:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Helper function to check if PDU is related to specific cabinet
const checkPduCabinetRelation = (pdu, cabinetNumber) => {
  // Check cabinet reference formats
  if (pdu.dc_feed_cabinet) {
    // New format: "1-BLVD-0" or "2-LLVD-1"
    const newFormatMatch = pdu.dc_feed_cabinet.match(/^(\d+)-[A-Z]{3,4}-\d+$/);
    if (newFormatMatch) {
      const pduCabinetNum = parseInt(newFormatMatch[1]);
      return pduCabinetNum === cabinetNumber;
    }
    
    // Legacy format: "Existing cabinet #1"
    const legacyFormatMatch = pdu.dc_feed_cabinet.match(/Existing cabinet #(\d+)/i);
    if (legacyFormatMatch) {
      const pduCabinetNum = parseInt(legacyFormatMatch[1]);
      return pduCabinetNum === cabinetNumber;
    }
  }
  
  // If no cabinet reference or doesn't match, return false
  return false;
};

// Helper function to get cabinet relation info
const getCabinetRelationInfo = (pdu, cabinetNumber) => {
  if (!pdu.dc_feed_cabinet) {
    return {
      has_relation: false,
      relation_type: 'none'
    };
  }
  
  const newFormatMatch = pdu.dc_feed_cabinet.match(/^(\d+)-([A-Z]{3,4})-(\d+)$/);
  if (newFormatMatch) {
    const [, cabNum, distType, distIndex] = newFormatMatch;
    return {
      has_relation: parseInt(cabNum) === cabinetNumber,
      relation_type: 'new_format',
      cabinet_number: parseInt(cabNum),
      distribution_type: distType,
      distribution_index: parseInt(distIndex),
      reference: pdu.dc_feed_cabinet
    };
  }
  
  const legacyFormatMatch = pdu.dc_feed_cabinet.match(/Existing cabinet #(\d+)/i);
  if (legacyFormatMatch) {
    const cabNum = parseInt(legacyFormatMatch[1]);
    return {
      has_relation: cabNum === cabinetNumber,
      relation_type: 'legacy_format',
      cabinet_number: cabNum,
      reference: pdu.dc_feed_cabinet
    };
  }
  
  return {
    has_relation: false,
    relation_type: 'unknown_format',
    reference: pdu.dc_feed_cabinet
  };
};

// POST /api/radio-units/:session_id
router.post('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { radio_unit_count, radio_units } = req.body;
    
    // Validate basic fields
    if (radio_unit_count && (radio_unit_count < 1 || radio_unit_count > 20)) {
      return res.status(400).json({ error: 'Radio unit count must be between 1 and 20' });
    }
    
    // Validate radio units data if provided
    if (radio_units && Array.isArray(radio_units)) {
      for (let i = 0; i < radio_units.length; i++) {
        try {
          validateRadioUnitData(radio_units[i]);
        } catch (error) {
          return res.status(400).json({ error: `Radio unit ${i + 1}: ${error.message}` });
        }
      }
    }
    
    // Check if data already exists for this session
    let radioUnitsRecord = await RadioUnits.findOne({
      where: { session_id }
    });
    
    if (radioUnitsRecord) {
      // Update existing record
      await radioUnitsRecord.update({ 
        radio_unit_count: radio_unit_count || 1,
        radio_units: radio_units || []
      });
      res.json({
        message: 'Radio units data updated successfully',
        data: radioUnitsRecord.toJSON()
      });
    } else {
      // Create new record
      radioUnitsRecord = await RadioUnits.create({
        session_id,
        radio_unit_count: radio_unit_count || 1,
        radio_units: radio_units || []
      });
      res.status(201).json({
        message: 'Radio units data created successfully',
        data: radioUnitsRecord.toJSON()
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/radio-units/:session_id
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { radio_unit_count, radio_units } = req.body;
    
    // Validate basic fields
    if (radio_unit_count && (radio_unit_count < 1 || radio_unit_count > 20)) {
      return res.status(400).json({ error: 'Radio unit count must be between 1 and 20' });
    }
    
    // Validate radio units data if provided
    if (radio_units && Array.isArray(radio_units)) {
      for (let i = 0; i < radio_units.length; i++) {
        try {
          validateRadioUnitData(radio_units[i]);
        } catch (error) {
          return res.status(400).json({ error: `Radio unit ${i + 1}: ${error.message}` });
        }
      }
    }
    
    let radioUnitsRecord = await RadioUnits.findOne({
      where: { session_id }
    });
    
    if (!radioUnitsRecord) {
      // Create new record if it doesn't exist
      radioUnitsRecord = await RadioUnits.create({
        session_id,
        radio_unit_count: radio_unit_count || 1,
        radio_units: radio_units || []
      });
    } else {
      // Update existing record
      await radioUnitsRecord.update({ 
        radio_unit_count: radio_unit_count || 1,
        radio_units: radio_units || []
      });
    }
    
    res.json({
      message: 'Radio units data updated successfully',
      data: radioUnitsRecord.toJSON()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/radio-units/:session_id/unit/:unit_index
router.put('/:session_id/unit/:unit_index', async (req, res) => {
  try {
    const { session_id, unit_index } = req.params;
    const radioUnitData = req.body;
    const index = parseInt(unit_index);
    
    // Validate radio unit data
    try {
      validateRadioUnitData(radioUnitData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    let radioUnitsRecord = await RadioUnits.findOne({
      where: { session_id }
    });
    
    if (!radioUnitsRecord) {
      // Create new record with empty structure
      radioUnitsRecord = await RadioUnits.create({
        session_id,
        radio_unit_count: Math.max(index + 1, 1),
        radio_units: []
      });
    }
    
    let radio_units = radioUnitsRecord.radio_units || [];
    
    // Ensure the array is large enough
    while (radio_units.length <= index) {
      radio_units.push({});
    }
    
    // Update the specific radio unit
    radio_units[index] = { ...radio_units[index], ...radioUnitData };
    
    await radioUnitsRecord.update({ 
      radio_units,
      radio_unit_count: Math.max(radioUnitsRecord.radio_unit_count, radio_units.length)
    });
    
    res.json({
      message: `Radio unit ${index + 1} updated successfully`,
      data: radioUnitsRecord.toJSON()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/radio-units/:session_id
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const radioUnitsRecord = await RadioUnits.findOne({
      where: { session_id }
    });
    
    if (!radioUnitsRecord) {
      return res.status(404).json({ 
        error: 'Radio units data not found for this session' 
      });
    }
    
    await radioUnitsRecord.destroy();
    
    res.json({
      message: 'Radio units data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 