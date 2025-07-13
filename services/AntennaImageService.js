const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const AntennaImages = require('../models/AntennaImages');

class AntennaImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/antenna_images');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
    ];
    this.ensureUploadDirectory();
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const rand = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `antenna_${timestamp}_${rand}${ext}`;
  }

  async saveFile(file) {
    if (!file) throw new Error('No file provided');
    if (file.size > this.maxFileSize) throw new Error('File too large');
    if (!this.allowedMimeTypes.includes(file.mimetype)) throw new Error('Invalid file type');

    await this.ensureUploadDirectory();
    const stored = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, stored);
    
    // Handle both buffer and file path cases
    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      // If multer saved the file to disk, move it to the final location
      const tempPath = file.path;
      try {
        await fs.rename(tempPath, filePath);
      } catch (err) {
        // If rename fails (e.g., across devices), fallback to copy
        await fs.copyFile(tempPath, filePath);
        await fs.unlink(tempPath); // Clean up temp file
      }
    } else {
      throw new Error('Invalid file format: no buffer or path found');
    }

    return { 
      originalName: file.originalname, 
      stored, 
      filePath, 
      fileUrl: `/uploads/antenna_images/${stored}`, 
      size: file.size, 
      mime: file.mimetype 
    };
  }

  async replaceImage({ file, session_id, antenna_number, image_category, description = null, metadata = {} }) {
    // Find existing image with the same category
    const existingImage = await AntennaImages.findOne({
      where: { 
        session_id, 
        antenna_number,
        image_category,
        is_active: true 
      }
    });

    // Save new file
    const info = await this.saveFile(file);

    if (existingImage) {
      // Delete old file
      try {
        await fs.unlink(existingImage.file_path);
      } catch (err) {
        console.warn('Could not delete old file:', err);
      }

      // Update existing record
      await existingImage.update({
        original_filename: info.originalName,
        stored_filename: info.stored,
        file_path: info.filePath,
        file_url: info.fileUrl,
        file_size: info.size,
        mime_type: info.mime,
        description,
        metadata,
        updated_at: new Date()
      });

      return { success: true, data: existingImage };
    }

    // Create new record if no existing image
    const newImage = await AntennaImages.create({
      session_id,
      antenna_number,
      record_index: 1,
      image_category,
      original_filename: info.originalName,
      stored_filename: info.stored,
      file_path: info.filePath,
      file_url: info.fileUrl,
      file_size: info.size,
      mime_type: info.mime,
      description,
      metadata
    });

    return { success: true, data: newImage };
  }

  async getImagesBySessionAndNumber(sessionId, antennaNumber) {
    return AntennaImages.findAll({
      where: { 
        session_id: sessionId, 
        antenna_number: antennaNumber, 
        is_active: true 
      },
      order: [['updated_at', 'DESC']]
    });
  }

  async deleteImagesBySessionAndNumber(sessionId, antennaNumber) {
    // Find all active images
    const images = await AntennaImages.findAll({
      where: { 
        session_id: sessionId, 
        antenna_number: antennaNumber, 
        is_active: true 
      }
    });

    // Delete files and deactivate records
    for (const image of images) {
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    // Deactivate all records
    const result = await AntennaImages.update(
      { is_active: false },
      { 
        where: { 
          session_id: sessionId, 
          antenna_number: antennaNumber, 
          is_active: true 
        } 
      }
    );

    return result[0];
  }

  async deleteAllImagesBySessionId(sessionId) {
    // Find all active images for this session
    const images = await AntennaImages.findAll({
      where: { 
        session_id: sessionId,
        is_active: true 
      }
    });

    // Delete files and deactivate records
    for (const image of images) {
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    // Deactivate all records
    const result = await AntennaImages.update(
      { is_active: false },
      { 
        where: { 
          session_id: sessionId,
          is_active: true 
        } 
      }
    );

    return result[0];
  }
}

module.exports = new AntennaImageService(); 