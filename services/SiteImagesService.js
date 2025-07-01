const BaseImageService = require('./BaseImageService');
const SiteImages = require('../models/SiteImages');
const fs = require('fs').promises;
const path = require('path');

class SiteImagesService extends BaseImageService {
  constructor() {
    // Pass model and upload directory path
    super(
      SiteImages,
      path.join(__dirname, '../uploads/site_images')
    );
    // Override directory name for URL construction to match static file serving
    this.directoryName = 'site_images';
  }

  // Override to use 'site' prefix for filenames to match existing pattern
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const crypto = require('crypto');
    const path = require('path');
    const rand = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `site_${timestamp}_${rand}${ext}`;
  }

  // Get empty image structure
  getEmptyImageStructure(category) {
    return {
      image_category: category,
      original_filename: '',
      stored_filename: '',
      file_path: '',
      file_url: '',
      file_size: 0,
      mime_type: '',
      description: null,
      metadata: null
    };
  }

  // Handle site image upload/replacement
  async handleSiteImageUpload(file, sessionId, imageCategory, description = null) {
    // Find existing image with the same category
    const existingImage = await this.modelClass.findOne({
      where: { 
        session_id: sessionId,
        image_category: imageCategory,
        is_active: true 
      }
    });

    // Save new file
    const info = await this.saveFile(file);

    if (existingImage) {
      // Delete old file from disk
      try {
        await fs.unlink(existingImage.file_path);
      } catch (err) {
        console.warn('Could not delete old file:', err);
      }

      // Update existing record with new file info
      await existingImage.update({
        original_filename: info.originalName,
        stored_filename: info.stored,
        file_path: info.filePath,
        file_url: info.fileUrl,
        file_size: info.size,
        mime_type: info.mime,
        description,
        metadata: {
          category: imageCategory
        }
      });

      return { success: true, data: existingImage };
    }

    // Create new record if no existing image
    const newImage = await this.modelClass.create({
      session_id: sessionId,
      image_category: imageCategory,
      original_filename: info.originalName,
      stored_filename: info.stored,
      file_path: info.filePath,
      file_url: info.fileUrl,
      file_size: info.size,
      mime_type: info.mime,
      description,
      metadata: {
        category: imageCategory
      }
    });

    return { success: true, data: newImage };
  }

  // Get all images for a session with empty placeholders
  async getSessionImages(sessionId) {
    const images = await this.modelClass.findAll({
      where: {
        session_id: sessionId,
        is_active: true
      },
      order: [['updated_at', 'DESC']]
    });

    // Create a map of existing images by category
    const imageMap = images.reduce((acc, img) => {
      acc[img.image_category] = img;
      return acc;
    }, {});

    // Get all possible categories
    const allCategories = [
      'site_entrance',
      'building_stairs_lift',
      'roof_entrance',
      'base_station_shelter',
      'site_name_shelter',
      'crane_access_street',
      'crane_location',
      'site_environment'
    ];

    // Return array with existing images or empty structures
    return allCategories.map(category => 
      imageMap[category] || {
        ...this.getEmptyImageStructure(category),
        session_id: sessionId
      }
    );
  }

  // Get specific category image for a session
  async getImageByCategory(sessionId, category) {
    const image = await this.modelClass.findOne({
      where: {
        session_id: sessionId,
        image_category: category,
        is_active: true
      }
    });

    return image || {
      ...this.getEmptyImageStructure(category),
      session_id: sessionId
    };
  }

  // Delete all images for a session
  async deleteAllSessionImages(sessionId) {
    const images = await this.modelClass.findAll({
      where: {
        session_id: sessionId,
        is_active: true
      }
    });

    for (const image of images) {
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    await this.modelClass.update(
      { is_active: false },
      {
        where: {
          session_id: sessionId,
          is_active: true
        }
      }
    );

    return { success: true, message: `All images for session ${sessionId} deleted` };
  }

  // Delete specific category image
  async deleteCategoryImage(sessionId, category) {
    const image = await this.modelClass.findOne({
      where: {
        session_id: sessionId,
        image_category: category,
        is_active: true
      }
    });

    if (image) {
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }

      await image.update({ is_active: false });
    }

    return { success: true, message: `Image ${category} deleted` };
  }
}

module.exports = new SiteImagesService(); 