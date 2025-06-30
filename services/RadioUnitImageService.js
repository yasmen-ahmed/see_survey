const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const RadioUnitImages = require('../models/RadioUnitImages');

class RadioUnitImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/radio_unit_images');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
    ];
    this.ensureUploadDirectory();
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }
  }

  generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename).toLowerCase();
    return `radio_unit_${timestamp}_${randomString}${extension}`;
  }

  async saveFile(file) {
    this.validateFile(file);
    
    const storedFilename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, storedFilename);
    const fileUrl = `/uploads/radio_unit_images/${storedFilename}`;
    
    await fs.writeFile(filePath, file.buffer);
    
    return {
      originalName: file.originalname,
      stored: storedFilename,
      filePath,
      fileUrl,
      size: file.size,
      mime: file.mimetype
    };
  }

  async replaceImage({ file, session_id, radio_unit_number, image_category, description = null, metadata = {} }) {
    // Find existing image with the same category
    const existingImage = await RadioUnitImages.findOne({
      where: { 
        session_id, 
        radio_unit_number,
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
    const newImage = await RadioUnitImages.create({
      session_id,
      radio_unit_number,
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

  async getImagesBySessionAndNumber(sessionId, radioUnitNumber) {
    return RadioUnitImages.findAll({
      where: { 
        session_id: sessionId, 
        radio_unit_number: radioUnitNumber, 
        is_active: true 
      },
      order: [['updated_at', 'DESC']]
    });
  }

  async deleteImagesBySessionAndNumber(sessionId, radioUnitNumber) {
    const images = await RadioUnitImages.findAll({
      where: { 
        session_id: sessionId, 
        radio_unit_number: radioUnitNumber, 
        is_active: true 
      }
    });

    for (const image of images) {
      // Delete physical file
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn(`Could not delete file ${image.file_path}:`, err);
      }

      // Mark as inactive
      await image.update({ is_active: false });
    }

    return images.length;
  }

  async deleteAllImagesBySessionId(sessionId) {
    const images = await RadioUnitImages.findAll({
      where: { 
        session_id: sessionId, 
        is_active: true 
      }
    });

    for (const image of images) {
      // Delete physical file
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn(`Could not delete file ${image.file_path}:`, err);
      }

      // Mark as inactive
      await image.update({ is_active: false });
    }

    return images.length;
  }

  async deleteImageById(imageId) {
    const image = await RadioUnitImages.findByPk(imageId);
    if (!image || !image.is_active) {
      throw new Error('Image not found');
    }

    // Delete physical file
    try {
      await fs.unlink(image.file_path);
    } catch (err) {
      console.warn(`Could not delete file ${image.file_path}:`, err);
    }

    // Mark as inactive
    await image.update({ is_active: false });
    return true;
  }
}

module.exports = new RadioUnitImageService(); 