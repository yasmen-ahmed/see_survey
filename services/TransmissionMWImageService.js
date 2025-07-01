const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const TransmissionMWImages = require('../models/TransmissionMWImages');

class TransmissionMWImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/transmission_mw');
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
    return `transmission_mw_${timestamp}_${rand}${ext}`;
  }

  async saveFile(file) {
    if (!file) throw new Error('No file provided');
    if (file.size > this.maxFileSize) throw new Error('File too large');
    if (!this.allowedMimeTypes.includes(file.mimetype)) throw new Error('Invalid file type');

    await this.ensureUploadDirectory();
    const stored = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, stored);
    await fs.writeFile(filePath, file.buffer);
    return { originalName: file.originalname, stored, filePath, fileUrl: `/uploads/transmission_mw/${stored}`, size: file.size, mime: file.mimetype };
  }

  async replaceImage({ file, session_id, image_category, description = null, metadata = {} }) {
    const existingImage = await TransmissionMWImages.findOne({
      where: { 
        session_id, 
        image_category,
        is_active: true 
      }
    });

    const info = await this.saveFile(file);

    if (existingImage) {
      try {
        await fs.unlink(existingImage.file_path);
      } catch (err) {
        console.warn('Could not delete old file:', err);
      }

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

    const newImage = await TransmissionMWImages.create({
      session_id,
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

  async getImagesBySessionId(sessionId) {
    return TransmissionMWImages.findAll({
      where: { 
        session_id: sessionId, 
        is_active: true 
      },
      order: [['updated_at', 'DESC']]
    });
  }

  async deleteAllImagesBySessionId(sessionId) {
    const images = await TransmissionMWImages.findAll({
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

    const result = await TransmissionMWImages.update(
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

module.exports = new TransmissionMWImageService(); 