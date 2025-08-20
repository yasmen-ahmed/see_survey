const RoomDCPowerSystemImages = require('../models/RoomDCPowerSystemImages');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class RoomDCPowerSystemImageService {
  
  /**
   * Get upload directory for room DC power system images
   */
  static getUploadDir() {
    return path.join(__dirname, '../uploads/room_dc_power_system');
  }
  
  /**
   * Ensure upload directory exists
   */
  static async ensureUploadDir() {
    const uploadDir = this.getUploadDir();
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    return uploadDir;
  }
  
  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, '');
    return `${baseName}_${timestamp}_${uuid}${ext}`;
  }
  
  /**
   * Save file to disk
   */
  static async saveFile(file, filename) {
    const uploadDir = await this.ensureUploadDir();
    const filePath = path.join(uploadDir, filename);
    
    await fs.writeFile(filePath, file.buffer);
    return filePath;
  }
  
  /**
   * Get images by session ID
   */
  static async getImagesBySessionId(sessionId) {
    try {
      const images = await RoomDCPowerSystemImages.findAll({
        where: {
          session_id: sessionId,
          is_active: true
        },
        order: [['image_category', 'ASC'], ['record_index', 'ASC']]
      });
      
      return images.map(img => ({
        id: img.id,
        image_category: img.image_category,
        original_filename: img.original_filename,
        file_url: img.file_url,
        file_size: img.file_size,
        mime_type: img.mime_type,
        description: img.description,
        created_at: img.created_at
      }));
    } catch (error) {
      console.error('Error getting room DC power system images:', error);
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve images'
      };
    }
  }
  
  /**
   * Replace image for a specific category
   */
  static async replaceImage({ file, session_id, image_category }) {
    try {
      if (!file || !session_id || !image_category) {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'File, session_id, and image_category are required'
        };
      }
      
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
        };
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'File size too large. Maximum size is 10MB'
        };
      }
      
      // Generate unique filename
      const filename = this.generateUniqueFilename(file.originalname);
      
      // Save file to disk
      const filePath = await this.saveFile(file, filename);
      
      // Get the next record index for this category
      const existingImage = await RoomDCPowerSystemImages.findOne({
        where: {
          session_id,
          image_category,
          is_active: true
        },
        order: [['record_index', 'DESC']]
      });
      
      const recordIndex = existingImage ? existingImage.record_index + 1 : 1;
      
      // Deactivate existing images for this category
      await RoomDCPowerSystemImages.update(
        { is_active: false },
        {
          where: {
            session_id,
            image_category,
            is_active: true
          }
        }
      );
      
      // Create new image record
      const imageRecord = await RoomDCPowerSystemImages.create({
        session_id,
        record_index: recordIndex,
        image_category,
        original_filename: file.originalname,
        stored_filename: filename,
        file_path: filePath,
        file_url: `/uploads/room_dc_power_system/${filename}`,
        file_size: file.size,
        mime_type: file.mimetype,
        description: `Room DC Power System - ${image_category}`,
        is_active: true
      });
      
      return {
        id: imageRecord.id,
        image_category: imageRecord.image_category,
        original_filename: imageRecord.original_filename,
        file_url: imageRecord.file_url,
        file_size: imageRecord.file_size,
        mime_type: imageRecord.mime_type,
        created_at: imageRecord.created_at
      };
      
    } catch (error) {
      console.error('Error replacing room DC power system image:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to upload image'
      };
    }
  }
  
  /**
   * Delete image by ID
   */
  static async deleteImage(imageId) {
    try {
      const image = await RoomDCPowerSystemImages.findByPk(imageId);
      
      if (!image) {
        throw {
          type: 'NOT_FOUND',
          message: 'Image not found'
        };
      }
      
      // Soft delete by setting is_active to false
      await image.update({ is_active: false });
      
      return {
        deleted: true,
        image_id: imageId
      };
      
    } catch (error) {
      console.error('Error deleting room DC power system image:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete image'
      };
    }
  }
  
  /**
   * Delete all images for a session
   */
  static async deleteImagesBySessionId(sessionId) {
    try {
      const deletedCount = await RoomDCPowerSystemImages.update(
        { is_active: false },
        {
          where: {
            session_id: sessionId,
            is_active: true
          }
        }
      );
      
      return {
        deleted: deletedCount[0] > 0,
        deletedCount: deletedCount[0]
      };
      
    } catch (error) {
      console.error('Error deleting room DC power system images by session:', error);
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete images'
      };
    }
  }
  
  /**
   * Get image statistics for a session
   */
  static async getImageStats(sessionId) {
    try {
      const stats = await RoomDCPowerSystemImages.findAll({
        where: {
          session_id: sessionId,
          is_active: true
        },
        attributes: [
          'image_category',
          [RoomDCPowerSystemImages.sequelize.fn('COUNT', RoomDCPowerSystemImages.sequelize.col('id')), 'count']
        ],
        group: ['image_category']
      });
      
      return stats.map(stat => ({
        category: stat.image_category,
        count: parseInt(stat.getDataValue('count'))
      }));
      
    } catch (error) {
      console.error('Error getting room DC power system image stats:', error);
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get image statistics'
      };
    }
  }
}

module.exports = RoomDCPowerSystemImageService; 