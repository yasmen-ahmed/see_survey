const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const RanRoomService = require('./RanRoomService');

class RanRoomImageService {
  /**
   * Get images by session ID
   */
  static async getImagesBySessionId(sessionId) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      const results = await sequelize.query(`
        SELECT 
          id,
          session_id,
          image_category,
          original_filename,
          stored_filename,
          file_path,
          file_url,
          file_size,
          mime_type,
          description,
          metadata,
          is_active,
          created_at,
          updated_at
        FROM ran_room_images 
        WHERE session_id = ? AND is_active = true
        ORDER BY image_category, created_at
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.SELECT
      });

      // Ensure we always return an array
      return Array.isArray(results) ? results : [];

    } catch (error) {
      console.error('RanRoomImageService.getImagesBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get RAN room images'
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

      // Ensure RAN room record exists before saving image
      await RanRoomService.getOrCreateBySessionId(session_id);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const storedFilename = `ran_room_${Date.now()}_${uuidv4()}${fileExtension}`;
      
      // Create upload directory
      const uploadDir = path.join(__dirname, '../uploads/ran_room');
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Save file
      const filePath = path.join(uploadDir, storedFilename);
      await fs.writeFile(filePath, file.buffer);
      
      // Generate file URL
      const fileUrl = `/uploads/ran_room/${storedFilename}`;
      
      // Deactivate existing image for this category
      await sequelize.query(`
        UPDATE ran_room_images 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ? AND image_category = ? AND is_active = true
      `, {
        replacements: [session_id, image_category],
        type: sequelize.QueryTypes.UPDATE
      });
      
      // Insert new image record
      const [result] = await sequelize.query(`
        INSERT INTO ran_room_images (
          session_id, image_category, original_filename, stored_filename, 
          file_path, file_url, file_size, mime_type, description, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          session_id,
          image_category,
          file.originalname,
          storedFilename,
          filePath,
          fileUrl,
          file.size,
          file.mimetype,
          `RAN Room ${image_category}`,
          JSON.stringify({
            uploaded_at: new Date().toISOString(),
            original_name: file.originalname,
            category: image_category
          })
        ],
        type: sequelize.QueryTypes.INSERT
      });
      
      return {
        id: result,
        session_id,
        image_category,
        original_filename: file.originalname,
        stored_filename: storedFilename,
        file_path: filePath,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        description: `RAN Room ${image_category}`,
        created_at: new Date(),
        updated_at: new Date()
      };

    } catch (error) {
      console.error('RanRoomImageService.replaceImage Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to replace RAN room image'
      };
    }
  }

  /**
   * Process and save multiple RAN room images
   */
  static async processAndSaveImages(sessionId, files) {
    try {
      if (!sessionId || !files || Object.keys(files).length === 0) {
        return;
      }

      const uploadPromises = [];

      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          
          // Skip BTS images (they are handled by BtsImageService)
          if (fieldName.startsWith('bts_')) {
            continue;
          }
          
          uploadPromises.push(
            this.replaceImage({
              file,
              session_id: sessionId,
              image_category: fieldName
            })
          );
        }
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

    } catch (error) {
      console.error('RanRoomImageService.processAndSaveImages Error:', error);
      throw error;
    }
  }

  /**
   * Delete image by ID
   */
  static async deleteImage(imageId) {
    try {
      if (!imageId) {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Image ID is required'
        };
      }

      // Get image info before deletion
      const [image] = await sequelize.query(`
        SELECT file_path, stored_filename FROM ran_room_images WHERE id = ?
      `, {
        replacements: [imageId],
        type: sequelize.QueryTypes.SELECT
      });

      if (!image) {
        throw {
          type: 'NOT_FOUND',
          message: 'Image not found'
        };
      }

      // Soft delete (mark as inactive)
      await sequelize.query(`
        UPDATE ran_room_images 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, {
        replacements: [imageId],
        type: sequelize.QueryTypes.UPDATE
      });

      // Optionally delete physical file
      try {
        await fs.unlink(image.file_path);
      } catch (fileError) {
        console.warn('Could not delete physical file:', fileError);
      }

      return {
        deleted: true,
        message: 'Image deleted successfully'
      };

    } catch (error) {
      console.error('RanRoomImageService.deleteImage Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete RAN room image'
      };
    }
  }

  /**
   * Delete images by session ID
   */
  static async deleteImagesBySessionId(sessionId) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      // Get all images for this session
      const [images] = await sequelize.query(`
        SELECT file_path FROM ran_room_images WHERE session_id = ?
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.SELECT
      });

      // Soft delete all images
      await sequelize.query(`
        UPDATE ran_room_images 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.UPDATE
      });

      // Delete physical files
      for (const image of images) {
        try {
          await fs.unlink(image.file_path);
        } catch (fileError) {
          console.warn('Could not delete physical file:', fileError);
        }
      }

      return {
        deleted: true,
        message: 'RAN room images deleted successfully'
      };

    } catch (error) {
      console.error('RanRoomImageService.deleteImagesBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete RAN room images'
      };
    }
  }

  /**
   * Get image statistics for a session
   */
  static async getImageStats(sessionId) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      const [results] = await sequelize.query(`
        SELECT 
          image_category,
          COUNT(*) as count,
          SUM(file_size) as total_size
        FROM ran_room_images 
        WHERE session_id = ? AND is_active = true
        GROUP BY image_category
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.SELECT
      });

      const totalImages = results.reduce((sum, row) => sum + parseInt(row.count), 0);
      const totalSize = results.reduce((sum, row) => sum + parseInt(row.total_size || 0), 0);

      return {
        session_id: sessionId,
        total_images: totalImages,
        total_size_bytes: totalSize,
        categories: results.map(row => ({
          category: row.image_category,
          count: parseInt(row.count),
          size_bytes: parseInt(row.total_size || 0)
        }))
      };

    } catch (error) {
      console.error('RanRoomImageService.getImageStats Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get RAN room image statistics'
      };
    }
  }
}

module.exports = RanRoomImageService; 