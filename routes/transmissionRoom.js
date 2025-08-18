const express = require('express');
const router = express.Router();
const TransmissionRoomService = require('../services/TransmissionRoomService');
const TransmissionRoomImageService = require('../services/TransmissionRoomImageService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

/**
 * GET /api/transmission-room/:sessionId
 * Get transmission room data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await TransmissionRoomService.getOrCreateBySessionId(sessionId);
    
    // Get images for this session
    const images = await TransmissionRoomImageService.getImagesBySessionId(sessionId);
    
    // Add images array to the response
    const responseData = {
      ...result,
      images: images.map(img => ({
        id: img.id,
        category: img.image_category,
        url: img.file_url,
        filename: img.original_filename,
        stored_filename: img.stored_filename,
        file_size: img.file_size,
        mime_type: img.mime_type,
        description: img.description,
        metadata: img.metadata,
        uploaded_at: img.created_at,
        updated_at: img.updated_at
      }))
    };
    
    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Transmission room data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting transmission room data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve transmission room data'
      }
    });
  }
});

/**
 * PUT /api/transmission-room/:sessionId
 * Update transmission room data by session ID
 */
router.put('/:sessionId', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let updateData = {};
    let imageResults = [];
    let hasImageUploadFailures = false;

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

    // Handle different types of requests
    if (req.body.data) {
      // Form-data with JSON data field
      try {
        updateData = JSON.parse(req.body.data);
      } catch (e) {
        updateData = req.body;
      }
    } else if (req.body.type_of_transmission || req.body.mw_links) {
      // Form-data with individual fields
      updateData = req.body;
    } else if (Object.keys(req.body).length > 0) {
      // Regular JSON body
      updateData = req.body;
    }

    // Process transmission data if present
    if (updateData && Object.keys(updateData).length > 0) {
      console.log('Processing transmission room data:', updateData);
      
      // Update transmission data
      const data = await TransmissionRoomService.getOrCreateBySessionId(sessionId, updateData);
      
      // Process image uploads if present
      if (req.files && req.files.length > 0) {
        console.log('Processing image uploads:', req.files.length);
        console.log('Files received:', req.files.map(f => ({ 
          fieldname: f.fieldname, 
          originalname: f.originalname, 
          mimetype: f.mimetype, 
          size: f.size,
          path: f.path 
        })));
        
        for (const file of req.files) {
          try {
            const imageCategory = file.fieldname;
            
            // Validate file before processing
            if (!file.path) {
              throw new Error(`File path is missing for ${file.fieldname}. File may not have been uploaded properly.`);
            }
            
            if (!file.originalname) {
              throw new Error(`Original filename is missing for ${file.fieldname}.`);
            }

            const result = await TransmissionRoomImageService.replaceImage({
              file,
              session_id: sessionId,
              image_category: imageCategory,
              description: null
            });

            imageResults.push({
              category: imageCategory,
              success: true,
              data: result.data
            });
          } catch (err) {
            hasImageUploadFailures = true;
            imageResults.push({
              category: file.fieldname,
              success: false,
              error: err.message
            });
          }
        }
      }

      // Get updated data with images
      const finalData = await TransmissionRoomService.getOrCreateBySessionId(sessionId);
      const images = await TransmissionRoomImageService.getImagesBySessionId(sessionId);
      
      const finalDataWithImages = {
        ...finalData,
        images: images.map(img => ({
          id: img.id,
          category: img.image_category,
          url: img.file_url,
          filename: img.original_filename,
          stored_filename: img.stored_filename,
          file_size: img.file_size,
          mime_type: img.mime_type,
          description: img.description,
          metadata: img.metadata,
          uploaded_at: img.created_at,
          updated_at: img.updated_at
        }))
      };

      const successCount = imageResults.filter(r => r.success).length;
      const failCount = imageResults.filter(r => !r.success).length;

      res.json({
        success: !hasImageUploadFailures,
        data: finalDataWithImages,
        message: hasImageUploadFailures
          ? `Data updated successfully, but ${failCount} image upload(s) failed`
          : `Data and ${successCount} image(s) updated successfully`,
        images_processed: {
          total: imageResults.length,
          successful: successCount,
          failed: failCount,
          details: imageResults
        }
      });

    } else if (req.files && req.files.length > 0) {
      // Only images, no data update
      console.log('Processing only image uploads:', req.files.length);
      
      for (const file of req.files) {
        try {
          const imageCategory = file.fieldname;

          const result = await TransmissionRoomImageService.replaceImage({
            file,
            session_id: sessionId,
            image_category: imageCategory,
            description: null
          });

          imageResults.push({
            category: imageCategory,
            success: true,
            data: result.data
          });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({
            category: file.fieldname,
            success: false,
            error: err.message
          });
        }
      }

      // Get current data with updated images
      const currentData = await TransmissionRoomService.getOrCreateBySessionId(sessionId);
      const images = await TransmissionRoomImageService.getImagesBySessionId(sessionId);
      
      const dataWithImages = {
        ...currentData,
        images: images.map(img => ({
          id: img.id,
          category: img.image_category,
          url: img.file_url,
          filename: img.original_filename,
          stored_filename: img.stored_filename,
          file_size: img.file_size,
          mime_type: img.mime_type,
          description: img.description,
          metadata: img.metadata,
          uploaded_at: img.created_at,
          updated_at: img.updated_at
        }))
      };

      const successCount = imageResults.filter(r => r.success).length;
      const failCount = imageResults.filter(r => !r.success).length;

      res.json({
        success: !hasImageUploadFailures,
        data: dataWithImages,
        message: hasImageUploadFailures
          ? `${failCount} image upload(s) failed`
          : `${successCount} image(s) uploaded successfully`,
        images_processed: {
          total: imageResults.length,
          successful: successCount,
          failed: failCount,
          details: imageResults
        }
      });

    } else {
      // No data and no files
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No data or files provided for update'
        }
      });
    }
    
  } catch (error) {
    console.error('Error updating transmission room data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update transmission room data'
      }
    });
  }
});

/**
 * DELETE /api/transmission-room/:sessionId
 * Delete transmission room data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await TransmissionRoomService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'Transmission room data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Transmission room data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting transmission room data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete transmission room data'
      }
    });
  }
});

/**
 * GET /api/transmission-room/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await TransmissionRoomService.getCabinetOptions(sessionId);
    
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