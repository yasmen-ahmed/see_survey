const express = require('express');
const router = express.Router();
const MWAntennasService = require('../services/MWAntennasService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const MWAntennasImageService = require('../services/MWAntennasImageService');

/**
 * GET /api/mw-antennas/:sessionId/operator-options
 * Get operator options from Site Information
 */
router.get('/:sessionId/operator-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validate session_id parameter
    if (!sessionId || sessionId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_PARAMETER',
          message: 'session_id is required'
        }
      });
    }
    
    const operatorOptions = await MWAntennasService.getOperatorOptions(sessionId);
    
    res.json({
      success: true,
      data: {
        session_id: sessionId,
        operator_options: operatorOptions,
        total_options: operatorOptions.length,
        source: 'site_information'
      }
    });
    
  } catch (error) {
    console.error('MW Antennas Operator Options Error:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error
    });
  }
});

/**
 * GET /api/mw-antennas/:sessionId
 * Get MW antennas data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await MWAntennasService.getOrCreateBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'MW Antennas data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting MW antennas data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve MW antennas data'
      }
    });
  }
});

/**
 * PUT /api/mw-antennas/:sessionId
 * Update MW antennas data by session ID
 */
router.put('/:sessionId', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let updateData = req.body;

    console.log('=== PUT REQUEST DEBUG ===');
    console.log('Session ID:', sessionId);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Files present:', req.files ? req.files.length : 0);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Raw body:', req.body);

    // Parse mwAntennasData from form data if it exists
    if (updateData.mwAntennasData && typeof updateData.mwAntennasData === 'string') {
      try {
        updateData.mwAntennasData = JSON.parse(updateData.mwAntennasData);
        console.log('Parsed mwAntennasData from string:', updateData.mwAntennasData);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: { type: 'VALIDATION_ERROR', message: 'Invalid mwAntennasData JSON format' }
        });
      }
    }

    // If no mwAntennasData in form, try to construct it from individual fields
    if (!updateData.mwAntennasData) {
      const numAntennas = parseInt(updateData.how_many_mw_antennas_on_tower) || 1;
      updateData.mwAntennasData = {
        mw_antennas: []
      };

      console.log('Constructing antenna data from form fields. Number of antennas:', numAntennas);

      for (let i = 0; i < numAntennas; i++) {
        // Log the raw field values
        console.log(`\n--- Antenna ${i + 1} Raw Fields ---`);
        console.log(`height: "${updateData[`mwAntennasData[mw_antennas][${i}][height]`]}"`);
        console.log(`diameter: "${updateData[`mwAntennasData[mw_antennas][${i}][diameter]`]}"`);
        console.log(`azimuth: "${updateData[`mwAntennasData[mw_antennas][${i}][azimuth]`]}"`);
        console.log(`oduLocation: "${updateData[`mwAntennasData[mw_antennas][${i}][oduLocation]`]}"`);
        console.log(`operator: "${updateData[`mwAntennasData[mw_antennas][${i}][operator]`]}"`);
        console.log(`farEndSiteId: "${updateData[`mwAntennasData[mw_antennas][${i}][farEndSiteId]`]}"`);
        console.log(`hopDistance: "${updateData[`mwAntennasData[mw_antennas][${i}][hopDistance]`]}"`);
        console.log(`linkCapacity: "${updateData[`mwAntennasData[mw_antennas][${i}][linkCapacity]`]}"`);
        console.log(`actionPlanned: "${updateData[`mwAntennasData[mw_antennas][${i}][actionPlanned]`]}"`);

        const antenna = {
          height: parseFloat(updateData[`mwAntennasData[mw_antennas][${i}][height]`]) || 0,
          diameter: parseFloat(updateData[`mwAntennasData[mw_antennas][${i}][diameter]`]) || 0,
          azimuth: parseFloat(updateData[`mwAntennasData[mw_antennas][${i}][azimuth]`]) || 0,
          oduLocation: updateData[`mwAntennasData[mw_antennas][${i}][oduLocation]`] || '',
          operator: updateData[`mwAntennasData[mw_antennas][${i}][operator]`] || '',
          farEndSiteId: updateData[`mwAntennasData[mw_antennas][${i}][farEndSiteId]`] || '',
          hopDistance: parseFloat(updateData[`mwAntennasData[mw_antennas][${i}][hopDistance]`]) || 0,
          linkCapacity: parseFloat(updateData[`mwAntennasData[mw_antennas][${i}][linkCapacity]`]) || 0,
          actionPlanned: updateData[`mwAntennasData[mw_antennas][${i}][actionPlanned]`] || ''
        };
        console.log(`Antenna ${i + 1} processed data:`, antenna);
        updateData.mwAntennasData.mw_antennas.push(antenna);
      }
    }
    
    console.log('Final processed update data:', JSON.stringify(updateData, null, 2));
    
    // Validate that we have data to update
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'No valid data provided for update' }
      });
    }

    // Check if mwAntennasData exists and has the correct structure
    if (!updateData.mwAntennasData || typeof updateData.mwAntennasData !== 'object') {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'mwAntennasData is required and must be an object' }
      });
    }

    // Check if mw_antennas exists and is an array
    if (!updateData.mwAntennasData.mw_antennas || !Array.isArray(updateData.mwAntennasData.mw_antennas)) {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'mw_antennas is required and must be an array' }
      });
    }

    // Validate that we have at least one antenna
    if (updateData.mwAntennasData.mw_antennas.length === 0) {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'At least one antenna must be provided' }
      });
    }

    // Validate each antenna in the array
    for (let i = 0; i < updateData.mwAntennasData.mw_antennas.length; i++) {
      const antenna = updateData.mwAntennasData.mw_antennas[i];
      
      if (!antenna || typeof antenna !== 'object') {
        return res.status(400).json({
          success: false,
          error: { type: 'VALIDATION_ERROR', message: `Antenna at index ${i} must be an object` }
      });
    }
    
      // Check required properties exist (they can be any value, we'll validate/convert them)
      const requiredProps = ['height', 'diameter', 'azimuth'];
      for (const prop of requiredProps) {
        if (!(prop in antenna)) {
          return res.status(400).json({
            success: false,
            error: { type: 'VALIDATION_ERROR', message: `Antenna at index ${i} is missing required property: ${prop}` }
          });
        }
      }
    }

    // Set the number of antennas from the array length
    updateData.how_many_mw_antennas_on_tower = updateData.mwAntennasData.mw_antennas.length;

    // Update MW antennas data
    let result = await MWAntennasService.getOrCreateBySessionId(sessionId, updateData);
    
    // Handle image uploads if present
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const field = file.fieldname;
          let antenna_number;
          
          // Handle both naming conventions: antenna_X_photo and mw_X_photo
          const antennaMatch = field.match(/antenna_(\d+)_/);
          const mwMatch = field.match(/mw_(\d+)_/);
          
          if (antennaMatch) {
            antenna_number = parseInt(antennaMatch[1], 10);
          } else if (mwMatch) {
            antenna_number = parseInt(mwMatch[1], 10);
          } else {
            throw new Error(`Invalid field name format: ${field}. Expected antenna_X_* or mw_X_* format`);
          }
          
          if (!antenna_number || antenna_number > updateData.how_many_mw_antennas_on_tower) {
            throw new Error(`Invalid antenna number ${antenna_number} in field ${field}. Must be between 1 and ${updateData.how_many_mw_antennas_on_tower}`);
          }

          const replaceRes = await MWAntennasImageService.replaceImage({
            file,
            session_id: sessionId,
            antenna_number,
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
      result = await MWAntennasService.getOrCreateBySessionId(sessionId);
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    const response = { 
      success: !hasImageUploadFailures,
      data: result,
      message: 'MW Antennas data updated successfully'
    };
    
    if (imageResults.length > 0) {
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
      
      if (hasImageUploadFailures) {
        response.message = `MW Antennas data updated but ${failCount} image upload(s) failed`;
      } else {
        response.message += ` and ${successCount} image(s) processed`;
      }
    }

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error updating MW antennas data:', error);
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update MW antennas data'
      }
    });
  }
});

/**
 * DELETE /api/mw-antennas/:sessionId
 * Delete MW antennas data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await MWAntennasService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'MW Antennas data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'MW Antennas data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting MW antennas data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete MW antennas data'
      }
    });
  }
});

/**
 * GET /api/mw-antennas/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await MWAntennasService.getCabinetOptions(sessionId);
    
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