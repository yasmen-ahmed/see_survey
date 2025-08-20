const path = require('path');
const fs = require('fs').promises;
const TransmissionRoomImages = require('../models/TransmissionRoomImages');

class TransmissionRoomImageService {
  
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/transmission_room');
    this.ensureUploadDir();
  }
  
  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }
  
  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalFilename);
    const name = path.basename(originalFilename, ext);
    
    return `transmission_room_${timestamp}_${rand}${ext}`;
  }
  
  /**
   * Store file and return file info
   */
  async storeFile(file) {
    // For disk storage, the file is already saved, we just need to move/copy it
    const stored = this.generateUniqueFilename(file.originalname);
    const newFilePath = path.join(this.uploadDir, stored);
    
    // Copy the file from its temporary location to our directory
    await fs.copyFile(file.path, newFilePath);
    
    return {
      stored,
      filePath: newFilePath,
      fileUrl: `/uploads/transmission_room/${stored}`,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  }
  
  /**
   * Replace image for a specific category (delete old, upload new)
   */
  async replaceImage({ file, session_id, image_category, description = null }) {
    try {
      // Find existing image for this category and session
      const existingImage = await TransmissionRoomImages.findOne({
        where: {
          session_id,
          image_category
        }
      });
      
             // Delete old file if it exists
       if (existingImage) {
         try {
           const oldFilePath = existingImage.file_path;
           if (await fs.access(oldFilePath).then(() => true).catch(() => false)) {
             await fs.unlink(oldFilePath);
           }
         } catch (error) {
           console.warn(`Could not delete old file: ${error.message}`);
         }
         
         // Delete old record
         await existingImage.destroy();
       }
      
      // Store new file
      const fileInfo = await this.storeFile(file);
      
      // Create new record
      const newImage = await TransmissionRoomImages.create({
        session_id,
        image_category,
        original_filename: file.originalname,
        stored_filename: fileInfo.stored,
        file_path: fileInfo.filePath,
        file_url: fileInfo.fileUrl,
        file_size: fileInfo.fileSize,
        mime_type: fileInfo.mimeType,
        description,
        record_index: 1
      });
      
      return {
        success: true,
        data: {
          id: newImage.id,
          category: newImage.image_category,
          url: newImage.file_url,
          filename: newImage.original_filename,
          stored_filename: newImage.stored_filename,
          file_size: newImage.file_size,
          mime_type: newImage.mime_type,
          description: newImage.description,
          uploaded_at: newImage.created_at,
          updated_at: newImage.updated_at
        }
      };
      
    } catch (error) {
      console.error('Error replacing image:', error);
      throw new Error(`Failed to replace image: ${error.message}`);
    }
  }
  
  /**
   * Get all images for a session
   */
  async getImagesBySessionId(sessionId) {
    try {
      return await TransmissionRoomImages.findAll({
        where: {
          session_id: sessionId,
          is_active: true
        },
        order: [['image_category', 'ASC'], ['record_index', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting images by session ID:', error);
      return [];
    }
  }
  
  /**
   * Get images by category for a session
   */
  async getImagesByCategory(sessionId, category) {
    try {
      const images = await TransmissionRoomImages.findAll({
        where: {
          session_id: sessionId,
          image_category: category,
          is_active: true
        },
        order: [['record_index', 'ASC']]
      });
      
      return images.map(img => ({
        id: img.id,
        category: img.image_category,
        url: img.file_url,
        filename: img.original_filename,
        stored_filename: img.stored_filename,
        file_size: img.file_size,
        mime_type: img.mime_type,
        description: img.description,
        uploaded_at: img.created_at,
        updated_at: img.updated_at
      }));
    } catch (error) {
      console.error('Error getting images by category:', error);
      return [];
    }
  }
  
  /**
   * Update image description
   */
  async updateImageDescription(imageId, description) {
    try {
      const result = await TransmissionRoomImages.update(
        { description },
        {
          where: { id: imageId },
          returning: true
        }
      );
      
      if (result[0] === 0) {
        throw new Error('Image not found');
      }
      
      return { success: true, message: 'Description updated successfully' };
    } catch (error) {
      console.error('Error updating image description:', error);
      throw new Error(`Failed to update description: ${error.message}`);
    }
  }
  
  /**
   * Delete image by ID
   */
  async deleteImage(imageId) {
    try {
      const image = await TransmissionRoomImages.findByPk(imageId);
      
      if (!image) {
        throw new Error('Image not found');
      }
      
             // Delete file from filesystem
       try {
         const filePath = image.file_path;
         if (await fs.access(filePath).then(() => true).catch(() => false)) {
           await fs.unlink(filePath);
         }
       } catch (error) {
         console.warn(`Could not delete file: ${error.message}`);
       }
      
      // Delete record from database
      await image.destroy();
      
      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}

module.exports = new TransmissionRoomImageService(); 