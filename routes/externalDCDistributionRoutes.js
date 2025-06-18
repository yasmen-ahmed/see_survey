const express = require('express');
const router = express.Router();
const ExternalDCDistribution = require('../models/ExternalDCDistribution');
const OutdoorCabinets = require('../models/OutdoorCabinets');

// Helper function to validate PDU data structure
const validatePDUData = (pduData) => {
  const validModels = ['Nokia FPFH', 'Nokia FPFD', 'DC panel', 'Other'];
  const validLocations = ['On ground level', 'On tower'];
  const validDistributionTypes = ['BI VD', 'LI VD', 'PDU'];
  const validYesNo = ['Yes', 'No'];

  if (pduData.dc_distribution_model && !validModels.includes(pduData.dc_distribution_model)) {
    throw new Error(`Invalid DC distribution model: ${pduData.dc_distribution_model}`);
  }
  if (pduData.dc_distribution_location && !validLocations.includes(pduData.dc_distribution_location)) {
    throw new Error(`Invalid DC distribution location: ${pduData.dc_distribution_location}`);
  }
  if (pduData.dc_feed_distribution_type && !validDistributionTypes.includes(pduData.dc_feed_distribution_type)) {
    throw new Error(`Invalid DC feed distribution type: ${pduData.dc_feed_distribution_type}`);
  }
  if (pduData.is_shared_panel && !validYesNo.includes(pduData.is_shared_panel)) {
    throw new Error(`Invalid shared panel value: ${pduData.is_shared_panel}`);
  }
  if (pduData.has_free_cbs_fuses && !validYesNo.includes(pduData.has_free_cbs_fuses)) {
    throw new Error(`Invalid free CBs/Fuses value: ${pduData.has_free_cbs_fuses}`);
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

// Get all External DC Distribution data (for admin purposes)
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