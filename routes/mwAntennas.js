const express = require('express');
const router = express.Router();
const MWAntennasService = require('../services/MWAntennasService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const MWAntennasImageService = require('../services/MWAntennasImageService');

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
    const updateData = req.body;

    // Validate that we have data to update
    if (!updateData && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { type: 'VALIDATION_ERROR', message: 'No data or files provided for update' }
      });
    }

    // Process form data for antenna updates
    const formData = {
      how_many_mw_antennas_on_tower: updateData.how_many_mw_antennas_on_tower,
      mwAntennasData: {
        mw_antennas: []
      }
    };

    // Get the number of antennas
    const numAntennas = parseInt(updateData.how_many_mw_antennas_on_tower) || 1;
    
    // Process each antenna's data
    for (let i = 1; i <= numAntennas; i++) {
      const antenna = {
        height: updateData[`mw_antenna_${i}_height`],
        diameter: updateData[`mw_antenna_${i}_diameter`],
        azimuth: updateData[`mw_antenna_${i}_azimuth`]
      };
      formData.mwAntennasData.mw_antennas.push(antenna);
    }

    // Update MW antennas data
    let result = await MWAntennasService.getOrCreateBySessionId(sessionId, formData);

    // Handle image uploads for each antenna
    const imageResults = [];
    let hasImageUploadFailures = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // fieldname format: antenna_<number>_<category>
        const field = file.fieldname; // e.g. "antenna_1_photo"
        const parts = field.split('_');
        const antenna_number = parseInt(parts[1], 10);
        const image_category = field;

        try {
          const replaceRes = await MWAntennasImageService.replaceImage({
            file,
            session_id: sessionId,
            antenna_number,
            image_category,
            description: updateData.description || null
          });
          imageResults.push({ field, success: true, data: replaceRes.data });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ field, success: false, error: err.message });
        }
      }
      
      // Refresh result with images included
      result = await MWAntennasService.getOrCreateBySessionId(sessionId);
    }

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    // If we have any image upload failures, return success: false
    if (hasImageUploadFailures) {
      return res.status(400).json({
        success: false,
        data: result,
        message: `MW Antennas data updated but ${failCount} image upload(s) failed`,
        images_processed: {
          total: imageResults.length,
          successful: successCount,
          failed: failCount,
          details: imageResults
        }
      });
    }

    const response = { 
      success: true, 
      data: result, 
      message: 'MW Antennas data updated successfully'
    };
    
    if (imageResults.length) {
      response.message += ` and ${successCount} image(s) uploaded/replaced`;
      response.images_processed = {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating MW antennas data:', error);
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : error.type === 'FOREIGN_KEY_ERROR' ? 404 : error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    res.status(statusCode).json({ success: false, error: { type: error.type || 'INTERNAL_ERROR', message: error.message || 'Failed to update MW antennas data' } });
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