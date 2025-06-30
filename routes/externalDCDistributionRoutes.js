const express = require('express');
const router = express.Router();
const ExternalDCDistributionService = require('../services/ExternalDCDistributionService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const ExternalDCDistributionImageService = require('../services/ExternalDCDistributionImageService');

/**
 * GET /api/external-dc-distribution/:sessionId
 * Get External DC Distribution data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await ExternalDCDistributionService.getOrCreateBySessionId(sessionId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'External DC Distribution data retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting External DC Distribution data:', error);

    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 :
      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve External DC Distribution data'
      }
    });
  }
});

/**
 * PUT /api/external-dc-distribution/:sessionId
 * Update External DC Distribution data by session ID
 */
router.put('/:sessionId', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let updateData = req.body;

    // Handle multipart/form-data format (when uploading files)
    if (req.files && req.files.length > 0) {
      // Parse externalDCData from form data if it exists
      if (updateData.externalDCData && typeof updateData.externalDCData === 'string') {
        try {
          updateData.externalDCData = JSON.parse(updateData.externalDCData);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: { type: 'VALIDATION_ERROR', message: 'Invalid externalDCData JSON format' }
          });
        }
      }

      // If no externalDCData in form, try to construct it from individual fields
      if (!updateData.externalDCData) {
        const numPDUs = parseInt(updateData.how_many_dc_pdus) || 0;
        updateData.externalDCData = {
          has_separate_dc_pdu: updateData.has_separate_dc_pdu || '',
          dc_pdus: []
        };

        for (let i = 1; i <= numPDUs; i++) {
          const pdu = {
            cabinet_ref: updateData[`pdu_${i}_cabinet_ref`] || '',
            dc_cb_fuse_rating: updateData[`pdu_${i}_dc_cb_fuse_rating`] || '',
            connected_load_description: updateData[`pdu_${i}_connected_load_description`] || '',
            cable_size: updateData[`pdu_${i}_cable_size`] || '',
            cable_length: parseFloat(updateData[`pdu_${i}_cable_length`]) || 0,
            remarks: updateData[`pdu_${i}_remarks`] || ''
          };
          updateData.externalDCData.dc_pdus.push(pdu);
        }
      }
    }

    // Validate that we have data to update
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'No valid data provided for update' }
      });
    }

    // Check if externalDCData exists and has the correct structure
    if (!updateData.externalDCData || typeof updateData.externalDCData !== 'object') {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'externalDCData is required and must be an object' }
      });
    }

    // Check if dc_pdus exists and is an array
    if (!updateData.externalDCData.dc_pdus || !Array.isArray(updateData.externalDCData.dc_pdus)) {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'dc_pdus is required and must be an array' }
      });
    }

    // Validate each PDU in the array
    for (let i = 0; i < updateData.externalDCData.dc_pdus.length; i++) {
      const pdu = updateData.externalDCData.dc_pdus[i];

      if (!pdu || typeof pdu !== 'object') {
        return res.status(400).json({
          success: false,
          error: { type: 'VALIDATION_ERROR', message: `PDU at index ${i} must be an object` }
        });
      }
    }

    // Set the number of PDUs from the array length
    updateData.how_many_dc_pdus = updateData.externalDCData.dc_pdus.length;

    // Update External DC Distribution data
    let result = await ExternalDCDistributionService.getOrCreateBySessionId(sessionId, updateData);

    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          let pdu_number;

          // Handle both naming conventions: pdu_X_photo and dc_X_photo
          const pduMatch = field.match(/pdu_(\d+)_/);
          const dcMatch = field.match(/dc_(\d+)_/);

          if (pduMatch) {
            pdu_number = parseInt(pduMatch[1], 10);
          } else if (dcMatch) {
            pdu_number = parseInt(dcMatch[1], 10);
          } else {
            throw new Error(`Invalid field name format: ${field}. Expected pdu_X_* or dc_X_* format`);
          }

          if (!pdu_number || pdu_number > updateData.how_many_dc_pdus) {
            throw new Error(`Invalid PDU number ${pdu_number} in field ${field}. Must be between 1 and ${updateData.how_many_dc_pdus}`);
          }

          const replaceRes = await ExternalDCDistributionImageService.replaceImage({
            file,
            session_id: sessionId,
            pdu_number,
            image_category: field,
            description: updateData[`${field}_description`] || null
          });
          imageResults.push({ field, success: true, data: replaceRes.data });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field: file.fieldname, success: false, error: err.message });
        }
      }

      // Refresh result to include updated images
      result = await ExternalDCDistributionService.getOrCreateBySessionId(sessionId);
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    const response = {
      success: !hasImageUploadFailures,
      data: result,
      message: 'External DC Distribution data updated successfully'
    };

    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };

      if (hasImageUploadFailures) {
        response.message = `External DC Distribution data updated but ${failCount} image upload(s) failed`;
    } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating External DC Distribution data:', error);
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 :
      error.type === 'FOREIGN_KEY_ERROR' ? 404 :
        error.type === 'DUPLICATE_ERROR' ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update External DC Distribution data'
      }
    });
  }
});

/**
 * DELETE /api/external-dc-distribution/:sessionId
 * Delete External DC Distribution data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await ExternalDCDistributionService.deleteBySessionId(sessionId);

    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
      message: 'External DC Distribution data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'External DC Distribution data not found for this session'
        }
      });
    }

  } catch (error) {
    console.error('Error deleting External DC Distribution data:', error);

    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete External DC Distribution data'
      }
    });
  }
});

/**
 * GET /api/external-dc-distribution/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const options = await ExternalDCDistributionService.getCabinetOptions(sessionId);

    res.status(200).json({
      success: true,
      data: {
        session_id: sessionId,
        cabinet_options: options
      },
      message: 'Cabinet options retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting cabinet options:', error);

    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve cabinet options'
      }
    });
  }
});

module.exports = router; 