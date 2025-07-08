const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OutdoorGeneralLayoutImages = require('../models/OutdoorGeneralLayoutImages');

class OutdoorGeneralLayoutImageService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads/outdoor_general_layout');
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
    } catch (error) {
      console.error('Error creating upload directory:', error);
      throw new Error('Failed to create upload directory');
    }
  }

  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const rand = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `outdoor_general_layout_${timestamp}_${rand}${ext}`;
  }

  async saveFile(file) {
    try {
      console.log('Saving file:', {
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      });

    if (!file) throw new Error('No file provided');
    if (file.size > this.maxFileSize) throw new Error('File too large');
    if (!this.allowedMimeTypes.includes(file.mimetype)) throw new Error('Invalid file type');

      this.ensureUploadDirectory();
    const stored = this.generateUniqueFilename(file.originalname);
      const finalPath = path.join(this.uploadDir, stored);

      // Copy file from temp location to final location
      fs.copyFileSync(file.path, finalPath);

      // Clean up temp file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn('Failed to cleanup temp file:', err);
      }

      return {
        originalName: file.originalname,
        stored,
        filePath: finalPath,
        fileUrl: `/uploads/outdoor_general_layout/${stored}`,
        size: file.size,
        mime: file.mimetype
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  async replaceImage({ file, session_id, image_category, description = null, metadata = {} }) {
    try {
      console.log('Processing image replacement:', {
        category: image_category,
        sessionId: session_id,
        originalname: file.originalname
      });

    const existingImage = await OutdoorGeneralLayoutImages.findOne({
      where: { 
        session_id, 
        image_category,
        is_active: true 
      }
    });

    const info = await this.saveFile(file);

    if (existingImage) {
        console.log('Found existing image to replace:', existingImage.file_path);
        
      try {
          if (fs.existsSync(existingImage.file_path)) {
            fs.unlinkSync(existingImage.file_path);
            console.log('Successfully deleted old file');
          }
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

      console.log('Creating new image record');
    const newImage = await OutdoorGeneralLayoutImages.create({
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
        metadata,
        is_active: true
    });

    return { success: true, data: newImage };
    } catch (error) {
      console.error('Error in replaceImage:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async getImagesBySessionId(sessionId) {
    return OutdoorGeneralLayoutImages.findAll({
      where: { 
        session_id: sessionId, 
        is_active: true 
      },
      order: [['updated_at', 'DESC']]
    });
  }

  async deleteAllImagesBySessionId(sessionId) {
    const images = await OutdoorGeneralLayoutImages.findAll({
      where: { 
        session_id: sessionId,
        is_active: true 
      }
    });

    for (const image of images) {
      try {
        if (fs.existsSync(image.file_path)) {
          fs.unlinkSync(image.file_path);
        }
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    const result = await OutdoorGeneralLayoutImages.update(
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

module.exports = new OutdoorGeneralLayoutImageService(); 