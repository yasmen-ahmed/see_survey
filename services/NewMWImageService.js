const fs = require('fs').promises;
const fsSync = require('fs'); // For createReadStream / existsSync
const path = require('path');
const crypto = require('crypto');
const NewMWImage = require('../models/NewMWImage');

class NewMWImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/new_mw');
    this.maxFileSize = 10 * 1024 * 1024; // 10 MB
    this.allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
    ];
    this.ensureUploadDirectory();
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch (err) {
      // Directory doesn’t exist → create
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  generateUniqueFilename(originalName) {
    const time = Date.now();
    const rand = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `mw_${time}_${rand}${ext}`;
  }

  async validateFile(file) {
    if (!file) throw new Error('No file provided');
    if (file.size > this.maxFileSize) {
      throw new Error(`File size too large (max ${this.maxFileSize / (1024 * 1024)} MB)`);
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type');
    }
  }

  async saveFileToDisk(file) {
    await this.validateFile(file);
    await this.ensureUploadDirectory();

    const stored = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, stored);

    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, filePath);
      await fs.unlink(file.path);
    } else {
      throw new Error('No file buffer or path found on uploaded file');
    }

    return {
      originalName: file.originalname,
      stored,
      fileUrl: `/uploads/new_mw/${stored}`
    };
  }

  /**
   * Uploads or replaces an image for a specific MW index & category
   * @param {Object} params
   *  - file: Multer file object
   *  - session_id: string
   *  - mw_index: number
   *  - image_category: string
   *  - description?: string
   */
  async uploadOrReplaceImage({ file, session_id, mw_index, image_category, description = null }) {
    if (!session_id || mw_index == null || !image_category) {
      throw new Error('Missing required params');
    }

    const { originalName, stored, fileUrl } = await this.saveFileToDisk(file);

    // Check if existing image present
    let record = await NewMWImage.findOne({
      where: { session_id, mw_index, image_category }
    });

    if (record) {
      // Delete previous file from disk
      try {
        const oldPath = path.join(this.uploadDir, record.stored_filename);
        if (fsSync.existsSync(oldPath)) {
          await fs.unlink(oldPath);
        }
      } catch (err) {
        console.warn('Could not delete old MW image:', err.message);
      }

      // Update record
      await record.update({
        original_filename: originalName,
        stored_filename: stored,
        file_url: fileUrl,
        description,
        updated_at: new Date()
      });
    } else {
      record = await NewMWImage.create({
        session_id,
        mw_index,
        image_category,
        original_filename: originalName,
        stored_filename: stored,
        file_url: fileUrl,
        description
      });
    }

    return record;
  }

  async getImagesBySession(sessionId) {
    return NewMWImage.findAll({ where: { session_id: sessionId }, order: [['updated_at', 'DESC']] });
  }

  async getImagesBySessionAndMWIndex(sessionId, mwIndex) {
    return NewMWImage.findAll({ where: { session_id: sessionId, mw_index: mwIndex } });
  }

  async deleteImage(imageId) {
    const record = await NewMWImage.findByPk(imageId);
    if (!record) throw new Error('Image not found');

    // Delete file on disk
    try {
      const filePath = path.join(this.uploadDir, record.stored_filename);
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (err) {
      console.warn('Could not delete image file:', err.message);
    }

    await record.destroy();
    return true;
  }

  async deleteImagesBySessionAndMWIndex(sessionId, mwIndex) {
    const records = await NewMWImage.findAll({ where: { session_id: sessionId, mw_index: mwIndex } });
    for (const rec of records) {
      await this.deleteImage(rec.id);
    }
    return true;
  }
}

module.exports = new NewMWImageService(); 