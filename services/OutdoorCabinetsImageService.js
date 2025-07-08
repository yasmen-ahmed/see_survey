const fs = require('fs');
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

  ensureUploadDirectory() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    } catch (err) {
      console.error('Error ensuring upload directory exists:', err);
      throw err;
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

    try {
      this.ensureUploadDirectory();
      const stored = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(this.uploadDir, stored);
      
      // Copy file from temp location to final destination
      fs.copyFileSync(file.path, filePath);
      
      return { 
        originalName: file.originalname, 
        stored, 
        filePath, 
        fileUrl: `/uploads/outdoor_cabinets/${stored}`, 
        size: file.size, 
        mime: file.mimetype 
      };
    } catch (err) {
      console.error('Error saving file:', err);
      throw err;
    }
  }

  async replaceImage({ file, session_id, cabinet_number, image_category, description = null, metadata = {} }) {
    try {
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
        // Delete old file if it exists
        if (existingImage.file_path && fs.existsSync(existingImage.file_path)) {
          try {
            fs.unlinkSync(existingImage.file_path);
          } catch (err) {
            console.warn('Could not delete old file:', err);
          }
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
    } catch (err) {
      console.error('Error replacing image:', err);
      throw err;
    }
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
    try {
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
        if (image.file_path && fs.existsSync(image.file_path)) {
          try {
            fs.unlinkSync(image.file_path);
          } catch (err) {
            console.warn('Could not delete file:', err);
          }
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
    } catch (err) {
      console.error('Error deleting images:', err);
      throw err;
    }
  }

  async deleteAllImagesBySessionId(sessionId) {
    try {
      // Find all active images for this session
      const images = await OutdoorCabinetsImages.findAll({
        where: { 
          session_id: sessionId,
          is_active: true 
        }
      });

      // Delete files and deactivate records
      for (const image of images) {
        if (image.file_path && fs.existsSync(image.file_path)) {
          try {
            fs.unlinkSync(image.file_path);
          } catch (err) {
            console.warn('Could not delete file:', err);
          }
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
    } catch (err) {
      console.error('Error deleting all images:', err);
      throw err;
    }
  }

  async cleanupAllImages() {
    try {
      // Find all images
      const images = await OutdoorCabinetsImages.findAll();

      // Delete all files
      for (const image of images) {
        if (image.file_path && fs.existsSync(image.file_path)) {
          try {
            fs.unlinkSync(image.file_path);
          } catch (err) {
            console.warn('Could not delete file:', err);
          }
        }
      }

      // Delete all records
      await OutdoorCabinetsImages.destroy({ where: {} });

      // Clean up upload directory
      if (fs.existsSync(this.uploadDir)) {
        const files = fs.readdirSync(this.uploadDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(this.uploadDir, file));
          } catch (err) {
            console.warn('Could not delete file:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up all images:', err);
      throw err;
    }
  }
}

module.exports = new OutdoorCabinetsImageService(); 