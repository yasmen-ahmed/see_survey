const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const RanRoomService = require('./RanRoomService');

class BtsImageService {
  /**
   * Get BTS images by session ID
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
          bts_index,
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
        FROM bts_images 
        WHERE session_id = ? AND is_active = true
        ORDER BY bts_index, image_category, created_at
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.SELECT
      });

      // Ensure we always return an array
      return Array.isArray(results) ? results : [];

    } catch (error) {
      console.error('BtsImageService.getImagesBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get BTS images'
      };
    }
  }

  /**
   * Replace image for a specific BTS and category
   */
  static async replaceImage({ file, session_id, bts_index, image_category }) {
    try {
      if (!file || !session_id || !bts_index || !image_category) {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'File, session_id, bts_index, and image_category are required'
        };
      }

      // Ensure RAN room record exists before saving image
      await RanRoomService.getOrCreateBySessionId(session_id);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const storedFilename = `bts_${bts_index}_${image_category}_${Date.now()}_${uuidv4()}${fileExtension}`;
      
      // Create upload directory
      const uploadDir = path.join(__dirname, '../uploads/bts_images');
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Save file
      const filePath = path.join(uploadDir, storedFilename);
      await fs.writeFile(filePath, file.buffer);
      
      // Generate file URL
      const fileUrl = `/uploads/bts_images/${storedFilename}`;
      
      // Deactivate existing image for this BTS and category
      await sequelize.query(`
        UPDATE bts_images 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ? AND bts_index = ? AND image_category = ? AND is_active = true
      `, {
        replacements: [session_id, bts_index, image_category],
        type: sequelize.QueryTypes.UPDATE
      });
      
      // Insert new image record
      const [result] = await sequelize.query(`
        INSERT INTO bts_images (
          session_id, bts_index, image_category, original_filename, stored_filename, 
          file_path, file_url, file_size, mime_type, description, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          session_id,
          bts_index,
          image_category,
          file.originalname,
          storedFilename,
          filePath,
          fileUrl,
          file.size,
          file.mimetype,
          `BTS ${bts_index} ${image_category}`,
          JSON.stringify({
            uploaded_at: new Date().toISOString(),
            original_name: file.originalname,
            bts_index: bts_index,
            category: image_category
          })
        ],
        type: sequelize.QueryTypes.INSERT
      });
      
      return {
        id: result,
        session_id,
        bts_index,
        image_category,
        original_filename: file.originalname,
        stored_filename: storedFilename,
        file_path: filePath,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        description: `BTS ${bts_index} ${image_category}`,
        created_at: new Date(),
        updated_at: new Date()
      };

    } catch (error) {
      console.error('BtsImageService.replaceImage Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to replace BTS image'
      };
    }
  }

  /**
   * Process and save multiple BTS images
   */
  static async processAndSaveImages(sessionId, files) {
    try {
      if (!sessionId || !files || Object.keys(files).length === 0) {
        return;
      }

      const uploadPromises = [];
      const processedFiles = new Map(); // Track processed files by field name and file content
      const categoryCounters = new Map(); // Track category counters for each BTS

      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          // Process each file in the array for this field name
          fileArray.forEach((file, index) => {
            // Create a unique identifier for this file
            const fileId = `${file.originalname}_${file.size}_${file.mimetype}`;
            
            // If we've already processed this exact file, skip it
            if (processedFiles.has(fileId)) {
              return;
            }
            processedFiles.set(fileId, true);
            
            // Parse field name to extract BTS index and category
            // Expected format: bts_1_rack_photo_1, bts_2_rack_photo_1_closed, etc.
            const fieldParts = fieldName.split('_');
            if (fieldParts.length >= 3 && fieldParts[0] === 'bts') {
              const btsIndex = parseInt(fieldParts[1]);
              const baseCategory = fieldParts.slice(2).join('_');
              
              if (!isNaN(btsIndex) && baseCategory) {
                // Create a unique key for this BTS and category combination
                const categoryKey = `${btsIndex}_${baseCategory}`;
                
                // Get or initialize counter for this category
                if (!categoryCounters.has(categoryKey)) {
                  categoryCounters.set(categoryKey, 0);
                }
                const counter = categoryCounters.get(categoryKey) + 1;
                categoryCounters.set(categoryKey, counter);
                
                // Create final category name with counter
                const finalCategory = counter > 1 ? `${baseCategory}_${counter}` : baseCategory;
                
                uploadPromises.push(
                  this.replaceImage({
                    file,
                    session_id: sessionId,
                    bts_index: btsIndex,
                    image_category: finalCategory
                  })
                );
              }
            }
          });
        }
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

    } catch (error) {
      console.error('BtsImageService.processAndSaveImages Error:', error);
      throw error;
    }
  }

  /**
   * Delete BTS images by session ID
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
        SELECT file_path FROM bts_images WHERE session_id = ?
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.SELECT
      });

      // Soft delete all images
      await sequelize.query(`
        UPDATE bts_images 
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
        message: 'BTS images deleted successfully'
      };

    } catch (error) {
      console.error('BtsImageService.deleteImagesBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete BTS images'
      };
    }
  }

  /**
   * Get BTS image statistics for a session
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
          bts_index,
          image_category,
          COUNT(*) as count,
          SUM(file_size) as total_size
        FROM bts_images 
        WHERE session_id = ? AND is_active = true
        GROUP BY bts_index, image_category
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
        bts_images: results.map(row => ({
          bts_index: parseInt(row.bts_index),
          category: row.image_category,
          count: parseInt(row.count),
          size_bytes: parseInt(row.total_size || 0)
        }))
      };

    } catch (error) {
      console.error('BtsImageService.getImageStats Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get BTS image statistics'
      };
    }
  }
}

module.exports = BtsImageService; 