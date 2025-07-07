const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BaseImageService {
  constructor(model, uploadPath) {
    this.model = model;
    this.modelClass = model; // alias for backwards compatibility
    this.uploadPath = uploadPath;
    // Extract the directory name for URL construction and filename prefix
    this.directoryName = path.basename(uploadPath);
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
    ];
    this.ensureUploadDirectory();
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const rand = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `${this.directoryName}_${timestamp}_${rand}${ext}`;
  }

  async saveFile(file) {
    try {
      if (!file) throw new Error('No file provided');
      if (file.size > this.maxFileSize) throw new Error('File too large');
      if (!this.allowedMimeTypes.includes(file.mimetype)) throw new Error('Invalid file type');
      if (!file.path) throw new Error('No file path provided');
  
      console.log('Processing file:', {
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      });
  
      await this.ensureUploadDirectory();
      const stored = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(this.uploadPath, stored);
      
      // Read from the temporary file
      const fileData = await fs.readFile(file.path);
      
      // Write to the destination
      await fs.writeFile(filePath, fileData);
      
      // Clean up the temporary file
      try {
        await fs.unlink(file.path);
      } catch (err) {
        console.warn('Failed to delete temp file:', err);
      }
  
      return { 
        originalName: file.originalname, 
        stored, 
        filePath, 
        fileUrl: `/uploads/${this.directoryName}/${stored}`, 
        size: file.size, 
        mime: file.mimetype 
      };
    } catch (error) {
      console.error('Error in saveFile:', error);
      throw error;
    }
  }

  async replaceImage({ file, session_id, record_id, image_category, description = null, metadata = {} }) {
    // Find existing image with the same category
    const existingImage = await this.model.findOne({
      where: { 
        session_id, 
        record_id,
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
    const newImage = await this.model.create({
      session_id,
      record_id,
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

  async getImagesBySessionAndRecord(sessionId, recordId) {
    return this.model.findAll({
      where: { 
        session_id: sessionId, 
        record_id: recordId,
        is_active: true 
      },
      order: [['updated_at', 'DESC']]
    });
  }

  async deleteImagesBySessionAndRecord(sessionId, recordId) {
    // Find all active images
    const images = await this.model.findAll({
      where: { 
        session_id: sessionId, 
        record_id: recordId,
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
    const result = await this.model.update(
      { is_active: false },
      { 
        where: { 
          session_id: sessionId, 
          record_id: recordId,
          is_active: true 
        } 
      }
    );

    return result[0];
  }

  async deleteAllImagesBySessionId(sessionId) {
    // Find all active images for this session
    const images = await this.model.findAll({
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
    const result = await this.model.update(
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
    const images = await this.model.findAll();

    // Delete all files
    for (const image of images) {
      try {
        await fs.unlink(image.file_path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    // Delete all records
    await this.model.destroy({ where: {} });

    // Clean up upload directory
    try {
      const files = await fs.readdir(this.uploadPath);
      for (const file of files) {
        try {
          await fs.unlink(path.join(this.uploadPath, file));
        } catch (err) {
          console.warn('Could not delete file:', err);
        }
      }
    } catch (err) {
      console.warn('Could not clean upload directory:', err);
    }

    return { success: true, message: 'All images cleaned up' };
  }

  async getImagesBySessionId(session_id) {
    try {
      const images = await this.model.findAll({
        where: {
          session_id,
          is_active: true
        },
        order: [
          ['created_at', 'DESC']
        ]
      });
      return images;
    } catch (error) {
      console.error(`Error fetching images for session ${session_id}:`, error);
      throw error;
    }
  }

  async saveImage(imageData) {
    try {
      const image = await this.model.create(imageData);
      return image;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }

  async deleteImage(id, session_id) {
    try {
      const image = await this.model.findOne({
        where: {
          id,
          session_id
        }
      });

      if (!image) {
        throw {
          type: 'NOT_FOUND',
          message: 'Image not found'
        };
      }

      // Delete the physical file
      try {
        await fs.unlink(image.file_path);
      } catch (error) {
        console.warn('Could not delete physical file:', error);
      }

      // Delete the database record
      await image.destroy();

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  generateStoredFilename(originalFilename, timestamp) {
    const ext = path.extname(originalFilename);
    const uniqueId = Buffer.from(Math.random().toString()).toString('hex').substring(0, 16);
    return `${this.uploadPath}_${timestamp}_${uniqueId}${ext}`;
  }

  async processUploadedFile(file, session_id, table_id, category) {
    const timestamp = Date.now();
    const storedFilename = this.generateStoredFilename(file.originalname, timestamp);
    const filePath = path.join(this.uploadPath, storedFilename);
    
    const imageData = {
      session_id,
      table_id,
      image_category: category,
      original_filename: file.originalname,
      stored_filename: storedFilename,
      file_path: filePath,
      file_url: `/uploads/${this.uploadPath}/${storedFilename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      is_active: true
    };

    return await this.saveImage(imageData);
  }
}

module.exports = BaseImageService; 