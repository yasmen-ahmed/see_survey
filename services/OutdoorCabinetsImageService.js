const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const OutdoorCabinetsImages = require('../models/OutdoorCabinetsImages');

class OutdoorCabinetsImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/outdoor_cabinets');
    this.maxFileSize = 10 * 1024 * 1024;
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
    return `outdoor_cabinet_${timestamp}_${rand}${ext}`;
  }

  async saveFile(file) {
    if (!file) throw new Error('No file provided');
    if (file.size > this.maxFileSize) throw new Error('File too large');
    if (!this.allowedMimeTypes.includes(file.mimetype)) throw new Error('Invalid file type');

    await this.ensureUploadDirectory();
    const stored = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, stored);
    await fs.writeFile(filePath, file.buffer);
    return { originalName: file.originalname, stored, filePath, fileUrl: `/uploads/outdoor_cabinets/${stored}`, size: file.size, mime: file.mimetype };
  }

  async replaceImage({ file, session_id, cabinet_number, image_category, description = null, metadata = {} }) {
    // Find existing image with the same category
    const existingImage = await OutdoorCabinetsImages.findOne({
      where: { 
        session_id, 
        cabinet_number, 
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
    const newImage = await OutdoorCabinetsImages.create({
      session_id,
      cabinet_number,
      image_category,
      record_index: 1,
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

  async getImagesBySessionAndNumber(sessionId, cabinetNumber) {
    return OutdoorCabinetsImages.findAll({
      where: { 
        session_id: sessionId, 
        cabinet_number: cabinetNumber, 
        is_active: true 
      },
      order: [['updated_at', 'DESC']]
    });
  }

  async deleteImagesBySessionAndNumber(sessionId, cabinetNumber) {
    // Find all active images
    const images = await OutdoorCabinetsImages.findAll({
      where: { 
        session_id: sessionId, 
        cabinet_number: cabinetNumber, 
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
    const result = await OutdoorCabinetsImages.update(
      { is_active: false },
      { 
        where: { 
          session_id: sessionId, 
          cabinet_number: cabinetNumber, 
          is_active: true 
        } 
      }
    );

    return result[0];
  }

  async deleteAllImagesBySessionId(sessionId) {
    // Find all active images for this session
    const images = await OutdoorCabinetsImages.findAll({
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
    const result = await OutdoorCabinetsImages.update(
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

  async cleanupAllImages() {
    // Find all images
    const images = await OutdoorCabinetsImages.findAll();

    // Delete all files
    for (const image of images) {
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    // Delete all records
    await OutdoorCabinetsImages.destroy({ where: {} });

    // Clean up upload directory
    try {
      const files = await fs.readdir(this.uploadDir);
      for (const file of files) {
        try {
          await fs.unlink(path.join(this.uploadDir, file));
        } catch (err) {
          console.warn('Could not delete file:', err);
        }
      }
    } catch (err) {
      console.warn('Could not clean upload directory:', err);
    }

    return { success: true, message: 'All images cleaned up' };
  }
}

module.exports = new OutdoorCabinetsImageService(); 