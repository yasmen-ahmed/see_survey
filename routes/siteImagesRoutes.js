const express = require('express');
const router = express.Router();
const SiteImagesService = require('../services/SiteImagesService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

// Valid image categories
const IMAGE_CATEGORIES = [
  'site_entrance',
  'building_stairs_lift',
  'roof_entrance',
  'base_station_shelter',
  'site_name_shelter',
  'crane_access_street',
  'crane_location',
  'site_environment'
];

// Get all images for a session
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const images = await SiteImagesService.getSessionImages(session_id);

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific category image
router.get('/:session_id/:category', async (req, res) => {
  try {
    const { session_id, category } = req.params;

    if (!IMAGE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${IMAGE_CATEGORIES.join(', ')}`
      });
    }

    const image = await SiteImagesService.getImageByCategory(session_id, category);

    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload/Update images for a session
router.put('/:session_id', uploadAnyWithErrorHandling, async (req, res) => {
  try {
    const { session_id } = req.params;
    const imageResults = [];
    let hasImageUploadFailures = false;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const category = file.fieldname;

        if (!IMAGE_CATEGORIES.includes(category)) {
          imageResults.push({
            category,
            success: false,
            error: `Invalid category. Must be one of: ${IMAGE_CATEGORIES.join(', ')}`
          });
          hasImageUploadFailures = true;
          continue;
        }

        try {
          const result = await SiteImagesService.handleSiteImageUpload(
            file,
            session_id,
            category
          );
          imageResults.push({ category, success: true, data: result.data });
        } catch (err) {
          hasImageUploadFailures = true;
          imageResults.push({ category, success: false, error: err.message });
        }
      }
    }

    // Get all updated images (including empty placeholders)
    const updatedImages = await SiteImagesService.getSessionImages(session_id);

    const successCount = imageResults.filter(r => r.success).length;
    const failCount = imageResults.filter(r => !r.success).length;

    const response = {
      success: !hasImageUploadFailures,
      data: updatedImages,
      message: hasImageUploadFailures
        ? `${failCount} image upload(s) failed`
        : `${successCount} image(s) uploaded successfully`,
      images_processed: {
        total: imageResults.length,
        successful: successCount,
        failed: failCount,
        details: imageResults
      }
    };

    res.status(hasImageUploadFailures ? 400 : 200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete specific category image
router.delete('/:session_id/:category', async (req, res) => {
  try {
    const { session_id, category } = req.params;

    if (!IMAGE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${IMAGE_CATEGORIES.join(', ')}`
      });
    }

    await SiteImagesService.deleteCategoryImage(session_id, category);

    // Return empty structure after deletion
    const emptyImage = SiteImagesService.getEmptyImageStructure(category);
    emptyImage.session_id = session_id;

    res.json({
      success: true,
      message: `Image ${category} deleted successfully`,
      data: emptyImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all images for a session
router.delete('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    await SiteImagesService.deleteAllSessionImages(session_id);

    // Return empty structures for all categories
    const emptyImages = IMAGE_CATEGORIES.map(category => ({
      ...SiteImagesService.getEmptyImageStructure(category),
      session_id
    }));

    res.json({
      success: true,
      message: 'All images deleted successfully',
      data: emptyImages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 