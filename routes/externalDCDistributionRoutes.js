const express = require('express');
const router = express.Router();
const ExternalDCDistribution = require('../models/ExternalDCDistribution');
const OutdoorCabinets = require('../models/OutdoorCabinets');

// Validation helper for PDU data
const validatePDUData = (pduData) => {
  const validModels = ['Nokia FPFH', 'Nokia FPFD', 'DC panel', 'Other'];
  const validLocations = ['On ground level', 'On tower'];
  const validDistributionTypes = ['BI VD', 'LI VD', 'PDU', 'BLVD', 'LLVD', 'blvd', 'llvd', 'pdu'];
  const validYesNo = ['Yes', 'No'];

  if (pduData.dc_distribution_model && !validModels.includes(pduData.dc_distribution_model)) {
    throw new Error(`Invalid DC distribution model: ${pduData.dc_distribution_model}`);
  }
  if (pduData.dc_distribution_location && !validLocations.includes(pduData.dc_distribution_location)) {
    throw new Error(`Invalid DC distribution location: ${pduData.dc_distribution_location}`);
  }
  if (pduData.dc_feed_distribution_type && !validDistributionTypes.includes(pduData.dc_feed_distribution_type)) {
    throw new Error(`Invalid DC feed distribution type: ${pduData.dc_feed_distribution_type}. Valid values: BLVD, LLVD, PDU, BI VD, LI VD`);
  }
  if (pduData.is_shared_panel && !validYesNo.includes(pduData.is_shared_panel)) {
    throw new Error(`Invalid shared panel value: ${pduData.is_shared_panel}`);
  }
  if (pduData.has_free_cbs_fuses && !validYesNo.includes(pduData.has_free_cbs_fuses)) {
    throw new Error(`Invalid free CBs/Fuses value: ${pduData.has_free_cbs_fuses}`);
  }

  // Validate cabinet reference format if provided
  if (pduData.dc_feed_cabinet) {
    const newCabinetRefPattern = /^\d+-[A-Z]{3,4}-\d+$/; // Format: "1-BLVD-0" or "2-LLVD-1" or "3-PDU-2"
    const legacyCabinetRefPattern = /^Existing cabinet #\d+$/i; // Format: "Existing cabinet #1"
    
    if (!newCabinetRefPattern.test(pduData.dc_feed_cabinet) && !legacyCabinetRefPattern.test(pduData.dc_feed_cabinet)) {
      throw new Error(`Invalid cabinet reference format: ${pduData.dc_feed_cabinet}. Expected format: "1-BLVD-0" or "Existing cabinet #1"`);
    }
  }

  // Validate cabinet details object if provided
  if (pduData.dc_feed_cabinet_details) {
    const details = pduData.dc_feed_cabinet_details;
    
    if (typeof details !== 'object') {
      throw new Error('Cabinet details must be an object');
    }
    
    if (details.cabinet_number && (!Number.isInteger(details.cabinet_number) || details.cabinet_number < 1)) {
      throw new Error('Cabinet number must be a positive integer');
    }
    
    if (details.distribution_type && !['BLVD', 'LLVD', 'PDU'].includes(details.distribution_type)) {
      throw new Error('Distribution type must be BLVD, LLVD, or PDU');
    }
    
    if (details.distribution_index && (!Number.isInteger(details.distribution_index) || details.distribution_index < 0)) {
      throw new Error('Distribution index must be a non-negative integer');
    }
  }
};

// Helper function to validate cabinet reference against actual cabinet data
const validateCabinetReference = async (sessionId, cabinetRef, cabinetDetails) => {
  if (!cabinetRef) {
    return true; // Skip validation if no cabinet reference provided
  }

  // Check if it's legacy format "Existing cabinet #X"
  const legacyCabinetRefPattern = /^Existing cabinet #\d+$/i;
  if (legacyCabinetRefPattern.test(cabinetRef)) {
    // For legacy format, skip detailed validation but check if cabinet exists
    const cabinetMatch = cabinetRef.match(/Existing cabinet #(\d+)/i);
    if (cabinetMatch) {
      const cabinetNumber = parseInt(cabinetMatch[1]);
      
      const cabinet = await OutdoorCabinets.findOne({
        where: { session_id: sessionId },
        attributes: ['cabinets']
      });

      if (!cabinet || !cabinet.cabinets) {
        throw new Error('No cabinet data found for this session');
      }

      const cabinetIndex = cabinetNumber - 1;
      if (!cabinet.cabinets[cabinetIndex]) {
        throw new Error(`Cabinet ${cabinetNumber} does not exist`);
      }
    }
    return true; // Legacy format validation passed
  }

  // For new format, we need cabinet details
  if (!cabinetDetails) {
    throw new Error('Cabinet details are required for new cabinet reference format');
  }

  try {
    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id: sessionId },
      attributes: ['cabinets']
    });

    if (!cabinet || !cabinet.cabinets) {
      throw new Error('No cabinet data found for this session');
    }

    const { cabinet_number, distribution_type, distribution_index } = cabinetDetails;
    const cabinetIndex = cabinet_number - 1;

    if (!cabinet.cabinets[cabinetIndex]) {
      throw new Error(`Cabinet ${cabinet_number} does not exist`);
    }

    const cabinetData = cabinet.cabinets[cabinetIndex];
    let distributionArray;

    switch (distribution_type) {
      case 'BLVD':
        distributionArray = cabinetData.blvdCBsRatings;
        break;
      case 'LLVD':
        distributionArray = cabinetData.llvdCBsRatings;
        break;
      case 'PDU':
        distributionArray = cabinetData.pduCBsRatings;
        break;
      default:
        throw new Error(`Invalid distribution type: ${distribution_type}`);
    }

    if (!distributionArray || !Array.isArray(distributionArray)) {
      throw new Error(`No ${distribution_type} data found in cabinet ${cabinet_number}`);
    }

    if (!distributionArray[distribution_index]) {
      throw new Error(`${distribution_type} index ${distribution_index} does not exist in cabinet ${cabinet_number}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Cabinet reference validation failed: ${error.message}`);
  }
};

// Helper function to get number of cabinets for a session
const getCabinetCount = async (sessionId) => {
  try {
    const outdoorCabinets = await OutdoorCabinets.findOne({
      where: { session_id: sessionId }
    });
    
    if (!outdoorCabinets) {
      return 0;
    }
    
    return outdoorCabinets.number_of_cabinets || 0;
  } catch (error) {
    console.warn(`Could not fetch cabinet count for session ${sessionId}:`, error.message);
    return 0;
  }
};

// Helper function to get default empty data structure
const getDefaultEmptyData = (sessionId) => {
  return {
    session_id: sessionId,
    has_separate_dc_pdu: '',
    pdu_count: 0,
    dc_pdus: [],
    created_at: null,
    updated_at: null
  };
};

// Get External DC Distribution data by session_id (includes number of cabinets)
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get cabinet count for this session
    const numberOfCabinets = await getCabinetCount(session_id);
    
    // Try to find existing data
    let dcDistribution = await ExternalDCDistribution.findOne({
      where: { session_id }
    });
    
    // If no data exists, return default empty structure
    if (!dcDistribution) {
      const defaultData = getDefaultEmptyData(session_id);
      return res.json({
        ...defaultData,
        number_of_cabinets: numberOfCabinets
      });
    }
    
    // Return existing data with number of cabinets
    res.json({
      ...dcDistribution.toJSON(),
      number_of_cabinets: numberOfCabinets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or Update External DC Distribution data by session_id (NO TOKEN REQUIRED)
router.post('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { has_separate_dc_pdu, pdu_count, dc_pdus } = req.body;
    
    // Validate basic fields
    if (has_separate_dc_pdu && !['Yes', 'No'].includes(has_separate_dc_pdu)) {
      return res.status(400).json({ error: 'Invalid value for has_separate_dc_pdu' });
    }
    
    if (pdu_count && (pdu_count < 0 || pdu_count > 10)) {
      return res.status(400).json({ error: 'PDU count must be between 0 and 10' });
    }
    
    // Validate PDU data if provided
    if (dc_pdus && Array.isArray(dc_pdus)) {
      for (let i = 0; i < dc_pdus.length; i++) {
        try {
          validatePDUData(dc_pdus[i]);
          
          // Validate cabinet reference if provided
          if (dc_pdus[i].dc_feed_cabinet) {
            await validateCabinetReference(
              session_id, 
              dc_pdus[i].dc_feed_cabinet, 
              dc_pdus[i].dc_feed_cabinet_details
            );
          }
        } catch (error) {
          return res.status(400).json({ error: `PDU ${i + 1}: ${error.message}` });
        }
      }
    }
    
    // Get cabinet count for response
    const numberOfCabinets = await getCabinetCount(session_id);
    
    // Check if data already exists for this session
    let dcDistribution = await ExternalDCDistribution.findOne({
      where: { session_id }
    });
    
    if (dcDistribution) {
      // Update existing record
      await dcDistribution.update({ 
        has_separate_dc_pdu: has_separate_dc_pdu || '',
        pdu_count: pdu_count || 0,
        dc_pdus: dc_pdus || []
      });
      res.json({
        message: 'External DC Distribution data updated successfully',
        data: {
          ...dcDistribution.toJSON(),
          number_of_cabinets: numberOfCabinets
        }
      });
    } else {
      // Create new record
      dcDistribution = await ExternalDCDistribution.create({
        session_id,
        has_separate_dc_pdu: has_separate_dc_pdu || '',
        pdu_count: pdu_count || 0,
        dc_pdus: dc_pdus || []
      });
      res.status(201).json({
        message: 'External DC Distribution data created successfully',
        data: {
          ...dcDistribution.toJSON(),
          number_of_cabinets: numberOfCabinets
        }
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update External DC Distribution data by session_id (PUT method - NO TOKEN REQUIRED)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { has_separate_dc_pdu, pdu_count, dc_pdus } = req.body;
    
    // Validate basic fields
    if (has_separate_dc_pdu && !['Yes', 'No'].includes(has_separate_dc_pdu)) {
      return res.status(400).json({ error: 'Invalid value for has_separate_dc_pdu' });
    }
    
    if (pdu_count && (pdu_count < 0 || pdu_count > 10)) {
      return res.status(400).json({ error: 'PDU count must be between 0 and 10' });
    }
    
    // Validate PDU data if provided
    if (dc_pdus && Array.isArray(dc_pdus)) {
      for (let i = 0; i < dc_pdus.length; i++) {
        try {
          validatePDUData(dc_pdus[i]);
          
          // Validate cabinet reference if provided
          if (dc_pdus[i].dc_feed_cabinet) {
            await validateCabinetReference(
              session_id, 
              dc_pdus[i].dc_feed_cabinet, 
              dc_pdus[i].dc_feed_cabinet_details
            );
          }
        } catch (error) {
          return res.status(400).json({ error: `PDU ${i + 1}: ${error.message}` });
        }
      }
    }
    
    // Get cabinet count for response
    const numberOfCabinets = await getCabinetCount(session_id);
    
    let dcDistribution = await ExternalDCDistribution.findOne({
      where: { session_id }
    });
    
    if (!dcDistribution) {
      // Create new record if it doesn't exist
      dcDistribution = await ExternalDCDistribution.create({
        session_id,
        has_separate_dc_pdu: has_separate_dc_pdu || '',
        pdu_count: pdu_count || 0,
        dc_pdus: dc_pdus || []
      });
    } else {
      // Update existing record
      await dcDistribution.update({ 
        has_separate_dc_pdu: has_separate_dc_pdu || '',
        pdu_count: pdu_count || 0,
        dc_pdus: dc_pdus || []
      });
    }
    
    res.json({
      message: 'External DC Distribution data updated successfully',
      data: {
        ...dcDistribution.toJSON(),
        number_of_cabinets: numberOfCabinets
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update specific PDU by index (NO TOKEN REQUIRED)
router.patch('/:session_id/pdu/:pdu_index', async (req, res) => {
  try {
    const { session_id, pdu_index } = req.params;
    const pduData = req.body;
    const index = parseInt(pdu_index);
    
    // Validate PDU data
    try {
      validatePDUData(pduData);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Get cabinet count for response
    const numberOfCabinets = await getCabinetCount(session_id);
    
    let dcDistribution = await ExternalDCDistribution.findOne({
      where: { session_id }
    });
    
    if (!dcDistribution) {
      // Create new record with empty structure
      dcDistribution = await ExternalDCDistribution.create({
        session_id,
        has_separate_dc_pdu: '',
        pdu_count: Math.max(index + 1, 1),
        dc_pdus: []
      });
    }
    
    let dc_pdus = dcDistribution.dc_pdus || [];
    
    // Ensure the array is large enough
    while (dc_pdus.length <= index) {
      dc_pdus.push({});
    }
    
    // Update the specific PDU
    dc_pdus[index] = { ...dc_pdus[index], ...pduData };
    
    await dcDistribution.update({ 
      dc_pdus,
      pdu_count: Math.max(dcDistribution.pdu_count, dc_pdus.length)
    });
    
    res.json({
      message: `PDU ${index + 1} updated successfully`,
      data: {
        ...dcDistribution.toJSON(),
        number_of_cabinets: numberOfCabinets
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Partial update External DC Distribution data by session_id (PATCH method - NO TOKEN REQUIRED)
router.patch('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const updateData = req.body;
    
    // Validate basic fields if provided
    if (updateData.has_separate_dc_pdu && !['Yes', 'No'].includes(updateData.has_separate_dc_pdu)) {
      return res.status(400).json({ error: 'Invalid value for has_separate_dc_pdu' });
    }
    
    if (updateData.pdu_count && (updateData.pdu_count < 0 || updateData.pdu_count > 10)) {
      return res.status(400).json({ error: 'PDU count must be between 0 and 10' });
    }
    
    // Validate PDU data if provided
    if (updateData.dc_pdus && Array.isArray(updateData.dc_pdus)) {
      for (let i = 0; i < updateData.dc_pdus.length; i++) {
        try {
          validatePDUData(updateData.dc_pdus[i]);
          
          // Validate cabinet reference if provided
          if (updateData.dc_pdus[i].dc_feed_cabinet) {
            await validateCabinetReference(
              session_id, 
              updateData.dc_pdus[i].dc_feed_cabinet, 
              updateData.dc_pdus[i].dc_feed_cabinet_details
            );
          }
        } catch (error) {
          return res.status(400).json({ error: `PDU ${i + 1}: ${error.message}` });
        }
      }
    }
    
    // Get cabinet count for response
    const numberOfCabinets = await getCabinetCount(session_id);
    
    let dcDistribution = await ExternalDCDistribution.findOne({
      where: { session_id }
    });
    
    if (!dcDistribution) {
      // Create new record if it doesn't exist
      dcDistribution = await ExternalDCDistribution.create({
        session_id,
        has_separate_dc_pdu: updateData.has_separate_dc_pdu || '',
        pdu_count: updateData.pdu_count || 0,
        dc_pdus: updateData.dc_pdus || []
      });
    } else {
      // Only update provided fields, keeping existing values for others
      const fieldsToUpdate = {};
      if (updateData.has_separate_dc_pdu !== undefined) {
        fieldsToUpdate.has_separate_dc_pdu = updateData.has_separate_dc_pdu;
      }
      if (updateData.pdu_count !== undefined) {
        fieldsToUpdate.pdu_count = updateData.pdu_count;
      }
      if (updateData.dc_pdus !== undefined) {
        fieldsToUpdate.dc_pdus = updateData.dc_pdus;
      }
      
      await dcDistribution.update(fieldsToUpdate);
    }
    
    res.json({
      message: 'External DC Distribution data partially updated successfully',
      data: {
        ...dcDistribution.toJSON(),
        number_of_cabinets: numberOfCabinets
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete External DC Distribution data by session_id (NO TOKEN REQUIRED)
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const dcDistribution = await ExternalDCDistribution.findOne({
      where: { session_id }
    });
    
    if (!dcDistribution) {
      return res.status(404).json({ 
        error: 'External DC Distribution data not found for this session' 
      });
    }
    
    await dcDistribution.destroy();
    
    res.json({
      message: 'External DC Distribution data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/external-dc-distribution/cabinet-options/:session_id
router.get('/cabinet-options/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id },
      attributes: ['number_of_cabinets', 'cabinets']
    });

    if (!cabinet) {
      return res.json({
        session_id,
        cabinet_options: []
      });
    }

    // Process cabinet data to create options for frontend
    const cabinetOptions = [];
    
    if (cabinet.cabinets && Array.isArray(cabinet.cabinets)) {
      cabinet.cabinets.forEach((cabinetData, cabinetIndex) => {
        const cabinetNumber = cabinetIndex + 1;
        
        // Process BLVD options
        if (cabinetData.blvdCBsRatings && Array.isArray(cabinetData.blvdCBsRatings)) {
          cabinetData.blvdCBsRatings.forEach((blvd, blvdIndex) => {
            if (blvd.connected_load) {
              cabinetOptions.push({
                cabinet_number: cabinetNumber,
                cabinet_index: cabinetIndex,
                distribution_type: 'BLVD',
                distribution_index: blvdIndex,
                rating: blvd.rating || '',
                connected_load: blvd.connected_load,
                display_text: `Cabinet ${cabinetNumber} - BLVD ${blvdIndex + 1} (${blvd.connected_load})`,
                value: `${cabinetNumber}-BLVD-${blvdIndex}`
              });
            }
          });
        }

        // Process LLVD options
        if (cabinetData.llvdCBsRatings && Array.isArray(cabinetData.llvdCBsRatings)) {
          cabinetData.llvdCBsRatings.forEach((llvd, llvdIndex) => {
            if (llvd.connected_load) {
              cabinetOptions.push({
                cabinet_number: cabinetNumber,
                cabinet_index: cabinetIndex,
                distribution_type: 'LLVD',
                distribution_index: llvdIndex,
                rating: llvd.rating || '',
                connected_load: llvd.connected_load,
                display_text: `Cabinet ${cabinetNumber} - LLVD ${llvdIndex + 1} (${llvd.connected_load})`,
                value: `${cabinetNumber}-LLVD-${llvdIndex}`
              });
            }
          });
        }

        // Process PDU options
        if (cabinetData.pduCBsRatings && Array.isArray(cabinetData.pduCBsRatings)) {
          cabinetData.pduCBsRatings.forEach((pdu, pduIndex) => {
            if (pdu.connected_load) {
              cabinetOptions.push({
                cabinet_number: cabinetNumber,
                cabinet_index: cabinetIndex,
                distribution_type: 'PDU',
                distribution_index: pduIndex,
                rating: pdu.rating || '',
                connected_load: pdu.connected_load,
                display_text: `Cabinet ${cabinetNumber} - PDU ${pduIndex + 1} (${pdu.connected_load})`,
                value: `${cabinetNumber}-PDU-${pduIndex}`
              });
            }
          });
        }
      });
    }

    res.json({
      session_id,
      total_cabinets: cabinet.number_of_cabinets || 0,
      cabinet_options: cabinetOptions
    });

  } catch (error) {
    console.error('Error fetching cabinet options:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/external-dc-distribution/cabinet-details/:session_id/:cabinet_number
router.get('/cabinet-details/:session_id/:cabinet_number', async (req, res) => {
  try {
    const { session_id, cabinet_number } = req.params;
    const cabinetIndex = parseInt(cabinet_number) - 1;

    if (isNaN(cabinetIndex) || cabinetIndex < 0) {
      return res.status(400).json({ error: 'Invalid cabinet number' });
    }

    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id },
      attributes: ['cabinets']
    });

    if (!cabinet || !cabinet.cabinets || !cabinet.cabinets[cabinetIndex]) {
      return res.status(404).json({ error: 'Cabinet not found' });
    }

    const cabinetData = cabinet.cabinets[cabinetIndex];
    
    const response = {
      session_id,
      cabinet_number: parseInt(cabinet_number),
      cabinet_index: cabinetIndex,
      distribution_options: {
        blvd: (cabinetData.blvdCBsRatings || []).map((blvd, index) => ({
          index,
          rating: blvd.rating || '',
          connected_load: blvd.connected_load || '',
          value: `${cabinet_number}-BLVD-${index}`,
          display_text: `BLVD ${index + 1}${blvd.connected_load ? ` (${blvd.connected_load})` : ''}`
        })),
        llvd: (cabinetData.llvdCBsRatings || []).map((llvd, index) => ({
          index,
          rating: llvd.rating || '',
          connected_load: llvd.connected_load || '',
          value: `${cabinet_number}-LLVD-${index}`,
          display_text: `LLVD ${index + 1}${llvd.connected_load ? ` (${llvd.connected_load})` : ''}`
        })),
        pdu: (cabinetData.pduCBsRatings || []).map((pdu, index) => ({
          index,
          rating: pdu.rating || '',
          connected_load: pdu.connected_load || '',
          value: `${cabinet_number}-PDU-${index}`,
          display_text: `PDU ${index + 1}${pdu.connected_load ? ` (${pdu.connected_load})` : ''}`
        }))
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching cabinet details:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/external-dc-distribution/cabinet-data/:session_id/:cabinet_number/:distribution_type
// Returns only the raw cabinet distribution data (rating and connected_load)
router.get('/cabinet-data/:session_id/:cabinet_number/:distribution_type', async (req, res) => {
  try {
    const { session_id, cabinet_number, distribution_type } = req.params;
    const cabinetIndex = parseInt(cabinet_number) - 1;

    if (isNaN(cabinetIndex) || cabinetIndex < 0) {
      return res.status(400).json({ error: 'Invalid cabinet number' });
    }

    if (!['BLVD', 'LLVD', 'PDU'].includes(distribution_type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid distribution type. Must be BLVD, LLVD, or PDU' });
    }

    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id },
      attributes: ['cabinets']
    });

    if (!cabinet || !cabinet.cabinets || !cabinet.cabinets[cabinetIndex]) {
      return res.status(404).json({ error: 'Cabinet not found' });
    }

    const cabinetData = cabinet.cabinets[cabinetIndex];
    let distributionData = [];

    // Get the specific distribution data based on type
    switch (distribution_type.toUpperCase()) {
      case 'BLVD':
        distributionData = cabinetData.blvdCBsRatings || [];
        break;
      case 'LLVD':
        distributionData = cabinetData.llvdCBsRatings || [];
        break;
      case 'PDU':
        distributionData = cabinetData.pduCBsRatings || [];
        break;
    }

    // Return raw data in simple format
    const response = {
      session_id,
      cabinet_number: parseInt(cabinet_number),
      distribution_type: distribution_type.toUpperCase(),
      data: distributionData.map((item, index) => ({
        field_number: index + 1,
        cb_rating_amp: item.rating || 0,
        connected_load: item.connected_load || ''
      }))
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching cabinet data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/external-dc-distribution/dc-cb-options/:session_id/:cabinet_ref
router.get('/dc-cb-options/:session_id/:cabinet_ref', async (req, res) => {
  try {
    const { session_id, cabinet_ref } = req.params;
    
    // Parse cabinet reference (format: "1-BLVD-0")
    const [cabinetNumber, distributionType, distributionIndex] = cabinet_ref.split('-');
    
    if (!cabinetNumber || !distributionType || distributionIndex === undefined) {
      return res.status(400).json({ 
        error: 'Invalid cabinet reference format. Expected: "1-BLVD-0"' 
      });
    }

    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id },
      attributes: ['cabinets']
    });

    if (!cabinet || !cabinet.cabinets) {
      return res.json({
        session_id,
        cabinet_ref,
        dc_cb_options: []
      });
    }

    const cabinetIndex = parseInt(cabinetNumber) - 1;
    const distIndex = parseInt(distributionIndex);
    
    if (!cabinet.cabinets[cabinetIndex]) {
      return res.status(404).json({ 
        error: `Cabinet ${cabinetNumber} not found` 
      });
    }

    const cabinetData = cabinet.cabinets[cabinetIndex];
    let targetDistributionArray;
    
    // Get the specific distribution array based on type
    switch (distributionType) {
      case 'BLVD':
        targetDistributionArray = cabinetData.blvdCBsRatings || [];
        break;
      case 'LLVD':
        targetDistributionArray = cabinetData.llvdCBsRatings || [];
        break;
      case 'PDU':
        targetDistributionArray = cabinetData.pduCBsRatings || [];
        break;
      default:
        return res.status(400).json({ 
          error: `Invalid distribution type: ${distributionType}` 
        });
    }

    if (!targetDistributionArray[distIndex]) {
      return res.status(404).json({ 
        error: `${distributionType} index ${distIndex} not found in cabinet ${cabinetNumber}` 
      });
    }

    // Generate DC CB/Fuse options for this specific distribution
    const selectedDistribution = targetDistributionArray[distIndex];
    const dcCbOptions = [];

    // Create CB/Fuse options based on the rating and connected load
    if (selectedDistribution.rating && selectedDistribution.connected_load) {
      const rating = selectedDistribution.rating;
      const connectedLoad = selectedDistribution.connected_load;
      
      // Generate typical CB/Fuse options based on rating
      const ratingValue = parseFloat(rating);
      
      if (!isNaN(ratingValue)) {
        // Generate options: 50%, 75%, 100%, 125% of the rating
        const percentages = [0.5, 0.75, 1.0, 1.25];
        
        percentages.forEach((percentage, index) => {
          const cbRating = Math.round(ratingValue * percentage);
          const cbType = cbRating <= 32 ? 'Fuse' : 'CB';
          
          dcCbOptions.push({
            id: `cb_${index + 1}`,
            rating: `${cbRating}A`,
            type: cbType,
            percentage: `${percentage * 100}%`,
            display_text: `${cbType} ${cbRating}A (${percentage * 100}% of ${rating})`,
            value: `${cbType}_${cbRating}A`,
            recommended: percentage === 1.0, // 100% is typically recommended
            cabinet_info: {
              cabinet_number: parseInt(cabinetNumber),
              distribution_type: distributionType,
              distribution_index: distIndex,
              connected_load: connectedLoad,
              source_rating: rating
            }
          });
        });

        // Add custom/other option
        dcCbOptions.push({
          id: 'custom',
          rating: 'Custom',
          type: 'Custom',
          percentage: 'Custom',
          display_text: 'Other/Custom CB or Fuse',
          value: 'custom',
          recommended: false,
          cabinet_info: {
            cabinet_number: parseInt(cabinetNumber),
            distribution_type: distributionType,
            distribution_index: distIndex,
            connected_load: connectedLoad,
            source_rating: rating
          }
        });
      }
    }

    // If no rating available, provide generic options
    if (dcCbOptions.length === 0) {
      const genericOptions = [
        { rating: '16A', type: 'Fuse' },
        { rating: '20A', type: 'Fuse' },
        { rating: '25A', type: 'Fuse' },
        { rating: '32A', type: 'Fuse' },
        { rating: '40A', type: 'CB' },
        { rating: '50A', type: 'CB' },
        { rating: '63A', type: 'CB' },
        { rating: '80A', type: 'CB' },
        { rating: '100A', type: 'CB' }
      ];

      genericOptions.forEach((option, index) => {
        dcCbOptions.push({
          id: `generic_${index + 1}`,
          rating: option.rating,
          type: option.type,
          percentage: 'Standard',
          display_text: `${option.type} ${option.rating}`,
          value: `${option.type}_${option.rating}`,
          recommended: option.rating === '32A', // Common default
          cabinet_info: {
            cabinet_number: parseInt(cabinetNumber),
            distribution_type: distributionType,
            distribution_index: distIndex,
            connected_load: selectedDistribution.connected_load || 'Unknown',
            source_rating: 'Not specified'
          }
        });
      });
    }

    res.json({
      session_id,
      cabinet_ref,
      cabinet_info: {
        cabinet_number: parseInt(cabinetNumber),
        distribution_type: distributionType,
        distribution_index: distIndex,
        connected_load: selectedDistribution.connected_load || '',
        rating: selectedDistribution.rating || ''
      },
      dc_cb_options: dcCbOptions.sort((a, b) => {
        // Sort by rating value (numeric)
        const aVal = parseFloat(a.rating) || 0;
        const bVal = parseFloat(b.rating) || 0;
        return aVal - bVal;
      })
    });

  } catch (error) {
    console.error('Error fetching DC CB options:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/external-dc-distribution/all-dc-cb-options/:session_id (for caching/preload)
router.get('/all-dc-cb-options/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const cabinet = await OutdoorCabinets.findOne({
      where: { session_id },
      attributes: ['cabinets']
    });

    if (!cabinet || !cabinet.cabinets) {
      return res.json({
        session_id,
        all_dc_cb_options: {}
      });
    }

    const allDcCbOptions = {};

    // Process each cabinet and build DC CB options for all distributions
    cabinet.cabinets.forEach((cabinetData, cabinetIndex) => {
      const cabinetNumber = cabinetIndex + 1;

      // Process BLVD
      if (cabinetData.blvdCBsRatings && Array.isArray(cabinetData.blvdCBsRatings)) {
        cabinetData.blvdCBsRatings.forEach((blvd, blvdIndex) => {
          const cabinetRef = `${cabinetNumber}-BLVD-${blvdIndex}`;
          allDcCbOptions[cabinetRef] = generateDcCbOptionsForDistribution(
            blvd, cabinetNumber, 'BLVD', blvdIndex
          );
        });
      }

      // Process LLVD
      if (cabinetData.llvdCBsRatings && Array.isArray(cabinetData.llvdCBsRatings)) {
        cabinetData.llvdCBsRatings.forEach((llvd, llvdIndex) => {
          const cabinetRef = `${cabinetNumber}-LLVD-${llvdIndex}`;
          allDcCbOptions[cabinetRef] = generateDcCbOptionsForDistribution(
            llvd, cabinetNumber, 'LLVD', llvdIndex
          );
        });
      }

      // Process PDU
      if (cabinetData.pduCBsRatings && Array.isArray(cabinetData.pduCBsRatings)) {
        cabinetData.pduCBsRatings.forEach((pdu, pduIndex) => {
          const cabinetRef = `${cabinetNumber}-PDU-${pduIndex}`;
          allDcCbOptions[cabinetRef] = generateDcCbOptionsForDistribution(
            pdu, cabinetNumber, 'PDU', pduIndex
          );
        });
      }
    });

    res.json({
      session_id,
      all_dc_cb_options: allDcCbOptions,
      cache_info: {
        generated_at: new Date().toISOString(),
        total_options: Object.keys(allDcCbOptions).length,
        expires_in: '1 hour' // Suggest cache duration
      }
    });

  } catch (error) {
    console.error('Error fetching all DC CB options:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Helper function to generate DC CB options for a distribution
const generateDcCbOptionsForDistribution = (distribution, cabinetNumber, distributionType, distributionIndex) => {
  const dcCbOptions = [];
  
  if (distribution.rating && distribution.connected_load) {
    const rating = distribution.rating;
    const connectedLoad = distribution.connected_load;
    const ratingValue = parseFloat(rating);
    
    if (!isNaN(ratingValue)) {
      const percentages = [0.5, 0.75, 1.0, 1.25];
      
      percentages.forEach((percentage, index) => {
        const cbRating = Math.round(ratingValue * percentage);
        const cbType = cbRating <= 32 ? 'Fuse' : 'CB';
        
        dcCbOptions.push({
          id: `cb_${index + 1}`,
          rating: `${cbRating}A`,
          type: cbType,
          percentage: `${percentage * 100}%`,
          display_text: `${cbType} ${cbRating}A (${percentage * 100}% of ${rating})`,
          value: `${cbType}_${cbRating}A`,
          recommended: percentage === 1.0
        });
      });

      dcCbOptions.push({
        id: 'custom',
        rating: 'Custom',
        type: 'Custom',
        percentage: 'Custom',
        display_text: 'Other/Custom CB or Fuse',
        value: 'custom',
        recommended: false
      });
    }
  }

  return {
    cabinet_info: {
      cabinet_number: cabinetNumber,
      distribution_type: distributionType,
      distribution_index: distributionIndex,
      connected_load: distribution.connected_load || '',
      rating: distribution.rating || ''
    },
    options: dcCbOptions
  };
};

// Get all External DC Distribution data (for admin purposes) - MOVED TO END
router.get('/', async (req, res) => {
  try {
    const dcDistributions = await ExternalDCDistribution.findAll({
      order: [['updated_at', 'DESC']]
    });
    
    res.json(dcDistributions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 