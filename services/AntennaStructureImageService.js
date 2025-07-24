const fs = require('fs').promises;
const fsSync = require('fs'); // For createReadStream
const path = require('path');
const crypto = require('crypto');
const AntennaStructureImages = require('../models/AntennaStructureImages');

class AntennaStructureImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/antenna_structure');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];
    this.ensureUploadDirectory();
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename).toLowerCase();
    return `antenna_structure_${timestamp}_${randomString}${extension}`;
  }

  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    return errors;
  }

  async saveFile(file) {
    // Validate file
    const validationErrors = this.validateFile(file);
    if (validationErrors.length > 0) {
      throw new Error(`File validation failed: ${validationErrors.join(', ')}`);
    }

    // Generate unique filename
    const storedFilename = this.generateUniqueFilename(file.originalname);
    
    // Create file path
    await this.ensureUploadDirectory();
    const filePath = path.join(this.uploadDir, storedFilename);
    
    if (file.buffer) {
      // Memory storage: write buffer directly
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      // Disk storage: move file from temp location
      await fs.copyFile(file.path, filePath);
      await fs.unlink(file.path); // Remove temp file
    } else {
      throw new Error('No file buffer or path found on uploaded file');
    }
    
    // Generate URL (relative to server)
    const fileUrl = `/uploads/antenna_structure/${storedFilename}`;
    
    return {
      originalFilename: file.originalname,
      storedFilename,
      filePath,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  }

  async uploadImage(imageData) {
    const {
      file,
      session_id,
      image_category,
      description = null,
      metadata = {}
    } = imageData;

    let fileInfo = null;

    try {
      // Save file to disk
      fileInfo = await this.saveFile(file);
      
      // Save to database
      const imageRecord = await AntennaStructureImages.create({
        session_id,
        image_category,
        original_filename: fileInfo.originalFilename,
        stored_filename: fileInfo.storedFilename,
        file_path: fileInfo.filePath,
        file_url: fileInfo.fileUrl,
        file_size: fileInfo.fileSize,
        mime_type: fileInfo.mimeType,
        description,
        metadata
      });

      return {
        success: true,
        data: imageRecord,
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      // If database save fails, try to clean up the file
      if (fileInfo && fileInfo.filePath) {
        try {
          await fs.unlink(fileInfo.filePath);
        } catch (cleanupError) {
          console.error('Failed to cleanup file after database error:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  async uploadMultipleImages(imagesData) {
    const results = [];
    const errors = [];

    for (let i = 0; i < imagesData.length; i++) {
      try {
        const result = await this.uploadImage(imagesData[i]);
        results.push(result);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          filename: imagesData[i].file?.originalname || 'unknown'
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      uploaded: results.length,
      failed: errors.length
    };
  }

  async getImagesBySessionId(sessionId) {
    const images = await AntennaStructureImages.findAll({
      where: { 
        session_id: sessionId,
        is_active: true 
      },
      order: [['upload_date', 'DESC']]
    });

    return images;
  }

  async getImagesGroupedByCategory(sessionId) {
    const images = await this.getImagesBySessionId(sessionId);
    
    // Group by category
    const grouped = {};
    images.forEach(image => {
      if (!grouped[image.image_category]) {
        grouped[image.image_category] = [];
      }
      grouped[image.image_category].push(image);
    });
    
    return grouped;
  }

  async getImageById(imageId) {
    const image = await AntennaStructureImages.findByPk(imageId);
    if (!image || !image.is_active) {
      throw new Error('Image not found');
    }
    return image;
  }

  async deleteImage(imageId) {
    const image = await this.getImageById(imageId);
    
    // Soft delete in database
    await image.update({ is_active: false });
    
    // Optionally delete file from disk (uncomment if you want hard delete)
    // try {
    //   await fs.unlink(image.file_path);
    // } catch (error) {
    //   console.warn('Failed to delete file from disk:', error.message);
    // }
    
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  }

  async deleteImagesBySessionAndCategory(sessionId, imageCategory) {
    try {
      // Find all active images for this session and category
      const images = await AntennaStructureImages.findAll({
        where: { 
          session_id: sessionId,
          image_category: imageCategory,
          is_active: true 
        }
      });

      if (images.length === 0) {
        return {
          deleted: 0,
          message: 'No images found to delete'
        };
      }

      // Soft delete all images
      const deletedCount = await AntennaStructureImages.update(
        { is_active: false },
        { 
          where: { 
            session_id: sessionId,
            image_category: imageCategory,
            is_active: true 
          } 
        }
      );

      // Optionally delete files from disk (uncomment if you want hard delete)
      // for (const image of images) {
      //   try {
      //     await fs.unlink(image.file_path);
      //   } catch (error) {
      //     console.warn(`Failed to delete file ${image.file_path} from disk:`, error.message);
      //   }
      // }

      return {
        deleted: deletedCount[0] || 0,
        message: `Deleted ${deletedCount[0] || 0} images for category ${imageCategory}`
      };
    } catch (error) {
      console.error('Error deleting images by session and category:', error);
      throw error;
    }
  }

  async updateImageMetadata(imageId, updates) {
    const image = await this.getImageById(imageId);
    
    const allowedFields = ['description', 'metadata'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }
    
    await image.update(updateData);
    
    return {
      success: true,
      data: image,
      message: 'Image metadata updated successfully'
    };
  }

  // Get available image categories
  getAvailableCategories() {
    return [
      'structure_general_photo',
      'structure_legs_photo_1',
      'structure_legs_photo_2', 
      'structure_legs_photo_3',
      'structure_legs_photo_4',
      'building_photo',
      'north_direction_view',
      'tower_ladder_and_cables_feeders_1',
      'tower_ladder_and_cables_feeders_2',
      'cable_tray_showing_all_cables_1',
      'cable_tray_showing_all_cables_2',
      'cable_tray_showing_all_cables_3',
      'cable_tray_showing_all_cables_4',
      'complete_tower_picture_from_different_angles_1',
      'complete_tower_picture_from_different_angles_2',
      'complete_tower_picture_from_different_angles_3',
      'tower_pic_top_of_tower_shows_measure_tool_with_reading',
      'tower_pic_bottom_of_tower_shows_measure_tool_with_reading',
      'tower_additional_picture_1',
      'tower_additional_picture_2',
      'tower_additional_picture_3',
      'tower_additional_picture_4',
      'tower_manufactory_specification_picture',
      'top_of_building_shows_measure_tool_with_reading_picture',
      'building_parapet_picture_with_measure_tool_and_length_reading',
      'rf_panorama_photos_0_deg',
      'rf_panorama_photos_30_deg',
      'rf_panorama_photos_60_deg',
      'rf_panorama_photos_90_deg',
      'rf_panorama_photos_120_deg',
      'rf_panorama_photos_150_deg',
      'rf_panorama_photos_180_deg',
      'rf_panorama_photos_210_deg',
      'rf_panorama_photos_240_deg',
      'rf_panorama_photos_270_deg',
      'rf_panorama_photos_300_deg',
      'rf_panorama_photos_330_deg',
      'night_beacon_picture',
      'lightening_rods'
    ];
  }

  // Get dynamic categories based on empty mounts count
  getDynamicCategories(emptyMountsCount = 0) {
    const baseCategories = this.getAvailableCategories();
    const dynamicCategories = [];
    
    // Add dynamic empty mount photo categories
    for (let i = 1; i <= emptyMountsCount; i++) {
      dynamicCategories.push(`empty_mount_side_arm_${i}_photo`);
    }
    
    return [...baseCategories, ...dynamicCategories];
  }

  /**
   * Replace existing image for a session/category or create new if none
   */
  async replaceImage(imageData) {
    const { file, session_id, image_category, description = null, metadata = {} } = imageData;

    // Save new file to disk
    const fileInfo = await this.saveFile(file);

    // Find existing active record
    let record = await AntennaStructureImages.findOne({
      where: { session_id, image_category, is_active: true }
    });

    if (record) {
      const oldPath = record.file_path;

      // Update record fields
      await record.update({
        original_filename: fileInfo.originalFilename,
        stored_filename: fileInfo.storedFilename,
        file_path: fileInfo.filePath,
        file_url: fileInfo.fileUrl,
        file_size: fileInfo.fileSize,
        mime_type: fileInfo.mimeType,
        description,
        metadata
      });

      // Delete old file from disk
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.warn('Failed to delete old file during replace:', err.message);
      }
    } else {
      // Create new record if none exists
      record = await AntennaStructureImages.create({
        session_id,
        image_category,
        original_filename: fileInfo.originalFilename,
        stored_filename: fileInfo.storedFilename,
        file_path: fileInfo.filePath,
        file_url: fileInfo.fileUrl,
        file_size: fileInfo.fileSize,
        mime_type: fileInfo.mimeType,
        description,
        metadata
      });
    }

    return {
      success: true,
      data: record,
      message: 'Image replaced successfully'
    };
  }
}

module.exports = new AntennaStructureImageService(); 