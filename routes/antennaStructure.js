const express = require('express');
const router = express.Router();
const AntennaStructureService = require('../services/AntennaStructureService');
const AntennaStructureImageService = require('../services/AntennaStructureImageService');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');

/**
 * GET /api/antenna-structure/:sessionId
 * Get antenna structure data by session ID
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await AntennaStructureService.getOrCreateBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Antenna Structure data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting antenna structure data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve antenna structure data'
      }
    });
  }
});

/**
 * PUT /api/antenna-structure/:sessionId
 * Update antenna structure data by session ID
 */
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    // Validate that we have data to update
    if (!updateData ) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No data provided for update'
        }
      });
    }
    
    const result = await AntennaStructureService.getOrCreateBySessionId(sessionId, updateData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Antenna Structure data updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating antenna structure data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 
                      error.type === 'FOREIGN_KEY_ERROR' ? 404 : 
                      error.type === 'DUPLICATE_ERROR' ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update antenna structure data'
      }
    });
  }
});

/**
 * DELETE /api/antenna-structure/:sessionId
 * Delete antenna structure data by session ID
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await AntennaStructureService.deleteBySessionId(sessionId);
    
    if (result.deleted) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'Antenna Structure data deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Antenna Structure data not found for this session'
        }
      });
    }
    
  } catch (error) {
    console.error('Error deleting antenna structure data:', error);
    
    const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.type || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete antenna structure data'
      }
    });
  }
});

/**
 * GET /api/antenna-structure/:sessionId/cabinet-options
 * Get available cabinet options for dropdowns
 */
router.get('/:sessionId/cabinet-options', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const options = await AntennaStructureService.getCabinetOptions(sessionId);
    
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

// =================== IMAGE UPLOAD ROUTES ===================

/**
 * POST /api/antenna-structure/:sessionId/images/upload
 * Upload a single image for antenna structure
 */
router.post('/:sessionId/images/upload', uploadSingle, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { image_category, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No image file provided'
        }
      });
    }
    
    if (!image_category) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'image_category is required'
        }
      });
    }
    
    // Validate image category
    const availableCategories = AntennaStructureImageService.getAvailableCategories();
    if (!availableCategories.includes(image_category)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: `Invalid image_category. Available categories: ${availableCategories.join(', ')}`
        }
      });
    }
    
    const result = await AntennaStructureImageService.uploadImage({
      file: req.file,
      session_id: sessionId,
      image_category,
      description: description || null
    });
    
    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Image uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading antenna structure image:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: error.message || 'Failed to upload image'
      }
    });
  }
});

/**
 * POST /api/antenna-structure/:sessionId/images/upload-multiple
 * Upload multiple images for antenna structure
 */
router.post('/:sessionId/images/upload-multiple', uploadMultiple, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { image_category, description } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'No image files provided'
        }
      });
    }
    
    if (!image_category) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'image_category is required'
        }
      });
    }
    
    // Validate image category
    const availableCategories = AntennaStructureImageService.getAvailableCategories();
    if (!availableCategories.includes(image_category)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: `Invalid image_category. Available categories: ${availableCategories.join(', ')}`
        }
      });
    }
    
    // Prepare data for each file
    const imagesData = req.files.map(file => ({
      file,
      session_id: sessionId,
      image_category,
      description: description || null
    }));
    
    const result = await AntennaStructureImageService.uploadMultipleImages(imagesData);
    
    res.status(201).json({
      success: result.success,
      data: {
        uploaded: result.uploaded,
        failed: result.failed,
        results: result.results,
        errors: result.errors
      },
      message: `Upload completed. ${result.uploaded} successful, ${result.failed} failed`
    });
    
  } catch (error) {
    console.error('Error uploading multiple antenna structure images:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: error.message || 'Failed to upload images'
      }
    });
  }
});

/**
 * GET /api/antenna-structure/:sessionId/images
 * Get all images for a specific session
 */
router.get('/:sessionId/images', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { category } = req.query;
    
    let images;
    if (category) {
      // Get images for specific category
      const allImages = await AntennaStructureImageService.getImagesBySessionId(sessionId);
      images = allImages.filter(img => img.image_category === category);
    } else {
      // Get all images
      images = await AntennaStructureImageService.getImagesBySessionId(sessionId);
    }
    
    res.status(200).json({
      success: true,
      data: {
        session_id: sessionId,
        total_images: images.length,
        category_filter: category || 'all',
        images: images
      },
      message: 'Images retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting antenna structure images:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve images'
      }
    });
  }
});

/**
 * GET /api/antenna-structure/:sessionId/images/grouped
 * Get images grouped by category
 */
router.get('/:sessionId/images/grouped', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const imagesGrouped = await AntennaStructureImageService.getImagesGroupedByCategory(sessionId);
    
    res.status(200).json({
      success: true,
      data: {
        session_id: sessionId,
        images_by_category: imagesGrouped,
        total_categories: Object.keys(imagesGrouped).length,
        available_categories: AntennaStructureImageService.getAvailableCategories()
      },
      message: 'Images grouped by category retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting grouped antenna structure images:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve grouped images'
      }
    });
  }
});

/**
 * DELETE /api/antenna-structure/images/:imageId
 * Delete a specific image
 */
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const result = await AntennaStructureImageService.deleteImage(imageId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting antenna structure image:', error);
    
    const statusCode = error.message === 'Image not found' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.message === 'Image not found' ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete image'
      }
    });
  }
});

/**
 * PUT /api/antenna-structure/images/:imageId
 * Update image metadata (description, etc.)
 */
router.put('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const updateData = req.body;
    
    const result = await AntennaStructureImageService.updateImageMetadata(imageId, updateData);
    
    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Image metadata updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating antenna structure image metadata:', error);
    
    const statusCode = error.message === 'Image not found' ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        type: error.message === 'Image not found' ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to update image metadata'
      }
    });
  }
});

/**
 * GET /api/antenna-structure/images/categories
 * Get available image categories
 */
router.get('/images/categories', async (req, res) => {
  try {
    const categories = AntennaStructureImageService.getAvailableCategories();
    
    res.status(200).json({
      success: true,
      data: {
        categories: categories,
        total_categories: categories.length
      },
      message: 'Available image categories retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting image categories:', error);
    
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve image categories'
      }
    });
  }
});

module.exports = router; 