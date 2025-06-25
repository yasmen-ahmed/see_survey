const express = require('express');
const router = express.Router();
const ExternalDCDistribution = require('../models/ExternalDCDistribution');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const ExternalDCDistributionImageService = require('../services/ExternalDCDistributionImageService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const ExternalDCDistributionService = require('../services/ExternalDCDistributionService');

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
    
    // Get data with images
    const data = await ExternalDCDistributionService.getBySessionId(session_id);
    
    res.json({
      ...data,
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
router.put('/:session_id', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id } = req.params;
    const updateData = req.body;
    
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
      // Update existing record
      await dcDistribution.update({ 
        has_separate_dc_pdu: updateData.has_separate_dc_pdu || '',
        pdu_count: updateData.pdu_count || 0,
        dc_pdus: updateData.dc_pdus || []
      });
    }

    // Handle image uploads
    const imageResults = [];
    let hasImageUploadFailures = false;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const field = file.fieldname; // e.g. "pdu_1_photo"
        const parts = field.split('_');
        const pduIndex = parseInt(parts[1], 10) - 1; // Convert to 0-based index

        try {
          const result = await ExternalDCDistributionImageService.handlePDUImageUpload(
            file,
            session_id,
            pduIndex,
            field
          );
          imageResults.push({ field, success: true, data: result.data });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field, success: false, error: err.message });
        }
      }
    }

    // Get final data with updated images
    const finalData = await ExternalDCDistributionService.getBySessionId(session_id);

    const response = {
      success: true,
      message: 'External DC Distribution data updated successfully',
      data: {
        ...finalData,
        number_of_cabinets: numberOfCabinets
      }
    };

    // Add image processing results if any images were uploaded
    if (imageResults.length > 0) {
      const successCount = imageResults.filter(r => r.success).length;
      const failCount = imageResults.filter(r => !r.success).length;

      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };

      if (successCount > 0) {
        response.message += ` and ${successCount} image(s) uploaded/replaced`;
      }
      if (failCount > 0) {
        response.message += ` (${failCount} failed)`;
      }
    }

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update specific PDU by index (NO TOKEN REQUIRED)
router.put('/:session_id/pdu/:pdu_index', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id, pdu_index } = req.params;
    const pduData = req.body;
    const index = parseInt(pdu_index);
    
    // Get cabinet count for response
    const numberOfCabinets = await getCabinetCount(session_id);
    
    // Update PDU data first
    const updatedData = await ExternalDCDistributionService.updatePDU(session_id, index, pduData);
    
    // Handle image uploads
    const imageResults = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const category = file.fieldname; // e.g. "pdu_1_photo"
        try {
          const result = await ExternalDCDistributionImageService.handlePDUImageUpload(
            file,
            session_id,
            index,
            category
          );
          imageResults.push({ category, success: true, data: result.data });
        } catch (err) {
          imageResults.push({ category, success: false, error: err.message });
        }
      }
    }

    // Get final data with updated images
    const finalData = await ExternalDCDistributionService.getBySessionId(session_id);

    res.json({
      success: true,
      message: `PDU ${index + 1} updated successfully`,
      data: {
        ...finalData,
        number_of_cabinets: numberOfCabinets
      },
      images_processed: imageResults.length > 0 ? {
        total: imageResults.length,
        successful: imageResults.filter(r => r.success).length,
        failed: imageResults.filter(r => !r.success).length,
        details: imageResults
      } : undefined
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Partial update External DC Distribution data by session_id (PUT method - NO TOKEN REQUIRED)
router.put('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const updateData = req.body;
    
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
    
    // Delete all images for this session first
    await ExternalDCDistributionImageService.deleteAllSessionImages(session_id);
    
    // Then delete the record
    await dcDistribution.destroy();
    
    res.json({
      message: 'External DC Distribution data and all associated images deleted successfully'
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
router.get('/cabinet-data/:session_id/:cabinet_number/:distribution_type', async (req, res) => {
  try {
    const { session_id, cabinet_number, distribution_type } = req.params;
    const cabinetIndex = parseInt(cabinet_number) - 1;

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
        targetDistributionArray = [];
    }

    // Generate DC CB/Fuse options for this specific distribution
    const selectedDistribution = targetDistributionArray[distIndex] || {};
    const dcCbOptions = [];

    // Create CB/Fuse options based on the rating and connected load
    if (selectedDistribution.rating && selectedDistribution.connected_load) {
      const rating = selectedDistribution.rating;
      const connectedLoad = selectedDistribution.connected_load;
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
            recommended: percentage === 1.0,
            cabinet_info: {
              cabinet_number: parseInt(cabinetNumber),
              distribution_type: distributionType,
              distribution_index: distIndex,
              connected_load: connectedLoad,
              source_rating: rating
            }
          });
        });

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
          recommended: option.rating === '32A',
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

// Add new image upload route
router.put('/:session_id/images/upload', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id } = req.params;
    const imageResults = [];
    let hasImageUploadFailures = false;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const field = file.fieldname; // e.g. "pdu_1_photo"
        const parts = field.split('_');
        const pduIndex = parseInt(parts[1], 10) - 1; // Convert to 0-based index

        try {
          const result = await ExternalDCDistributionImageService.handlePDUImageUpload(
            file,
            session_id,
            pduIndex,
            field
          );
          imageResults.push({ field, success: true, data: result.data });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field, success: false, error: err.message });
        }
      }
    }

    // Get final data with updated images
    const finalData = await ExternalDCDistributionService.getBySessionId(session_id);
    const numberOfCabinets = await getCabinetCount(session_id);

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    // If we have any image upload failures, return success: false
    if (hasImageUploadFailures) {
      return res.status(400).json({
        success: false,
        data: {
          ...finalData,
          number_of_cabinets: numberOfCabinets
        },
        message: `${failCount} image upload(s) failed`,
        images_processed: {
          total: imageResults.length,
          successful: successCount,
          failed: failCount,
          details: imageResults
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...finalData,
        number_of_cabinets: numberOfCabinets
      },
      message: `${successCount} image(s) uploaded successfully`,
      images_processed: {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete specific PDU
router.delete('/:session_id/pdu/:pdu_index', async (req, res) => {
  try {
    const { session_id, pdu_index } = req.params;
    const index = parseInt(pdu_index);

    // Delete all images for this PDU first
    await ExternalDCDistributionImageService.deleteAllPDUImages(session_id, index);

    // Then delete the PDU data
    const result = await ExternalDCDistributionService.deletePDU(session_id, index);

    res.json({
      success: true,
      message: `PDU ${index + 1} and all associated images deleted successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 