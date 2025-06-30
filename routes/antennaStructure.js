const express = require('express');
const router = express.Router();
const AntennaStructureService = require('../services/AntennaStructureService');
const AntennaStructureImageService = require('../services/AntennaStructureImageService');
const { uploadSingle, uploadMultiple, imageCategories } = require('../middleware/upload');

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
 * Update antenna structure data by session ID (with category-based image replacement)
 */
router.put('/:sessionId', uploadMultiple, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let updateData = {};

    // Handle both JSON and form-data
    if (req.body) {
      // If form-data, parse JSON fields (exclude image category names)
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Extract structure data from form fields (ignore image categories and description)
        Object.keys(req.body).forEach(key => {
          if (!imageCategories.includes(key) && key !== 'description') {
            try {
              // Try to parse as JSON first
              updateData[key] = JSON.parse(req.body[key]);
            } catch {
              // If not JSON, use as string
              updateData[key] = req.body[key];
            }
          }
        });
      } else {
        // Regular JSON body
        updateData = req.body;
      }
    }

    // Update antenna structure data if provided
    let result = null;
    if (Object.keys(updateData).length > 0) {
      result = await AntennaStructureService.getOrCreateBySessionId(sessionId, updateData);
    } else {
      result = await AntennaStructureService.getOrCreateBySessionId(sessionId);
    }

    // Handle image uploads/replacements if files are provided
    let imageResults = [];
    if (req.imagesByCategory && Object.keys(req.imagesByCategory).length > 0) {
      const { description } = req.body;

      // Process each category - replace existing image
      for (const [category, file] of Object.entries(req.imagesByCategory)) {
        try {
          // Replace (or create) image record, and delete old file internally
          const replaceResult = await AntennaStructureImageService.replaceImage({
            file,
            session_id: sessionId,
            image_category: category,
            description: description || null
          });
          imageResults.push({
            category,
            success: true,
            data: replaceResult.data
          });
        } catch (error) {
          imageResults.push({
            category,
            success: false,
            error: error.message
          });
        }
      }

      // Get updated data with new images
      result = await AntennaStructureService.getOrCreateBySessionId(sessionId);
    }

    const response = {
      success: true,
      data: result,
      message: 'Antenna Structure data updated successfully'
    };

    // Add image upload info if images were uploaded
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

    res.status(200).json(response);

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
    if (!imageCategories.includes(image_category)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: `Invalid image_category. Available categories: ${imageCategories.join(', ')}`
        }
      });
    }

    // Replace existing image or create new
    const replaceResult = await AntennaStructureImageService.replaceImage({
      file: req.file,
      session_id: sessionId,
      image_category,
      description: description || null
    });

    res.status(201).json({
      success: true,
      data: replaceResult.data,
      message: 'Image uploaded and replaced successfully'
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
        available_categories: imageCategories
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
    res.status(200).json({
      success: true,
      data: {
        categories: imageCategories,
        total_categories: imageCategories.length
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