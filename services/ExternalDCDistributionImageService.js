const BaseImageService = require('./BaseImageService');
const ExternalDCDistributionImages = require('../models/ExternalDCDistributionImages');
const fs = require('fs').promises;

class ExternalDCDistributionImageService extends BaseImageService {
  constructor() {
    super(
      'external_dc_distribution', // Upload directory name
      ExternalDCDistributionImages, // Model class
      'pdu' // File prefix for unique names
    );
  }

  // Handle PDU image upload with replacement
  async handlePDUImageUpload(file, sessionId, pduIndex, imageCategory, description = null) {
    // Find existing image with the same category
    const existingImage = await this.modelClass.findOne({
      where: { 
        session_id: sessionId,
        record_id: pduIndex,
        image_category: imageCategory,
        is_active: true
      }
    });

    // Save new file
    const info = await this.saveFile(file);

    if (existingImage) {
      // Delete old file from disk
      try {
        await fs.unlink(existingImage.file_path);
      } catch (err) {
        console.warn('Could not delete old file:', err);
      }

      // Update existing record with new file info
      await existingImage.update({
        original_filename: info.originalName,
        stored_filename: info.stored,
        file_path: info.filePath,
        file_url: info.fileUrl,
        file_size: info.size,
        mime_type: info.mime,
        description,
        metadata: {
          pdu_index: pduIndex,
          category: imageCategory
        }
      });

      return { success: true, data: existingImage };
    }

    // Create new record if no existing image
    const newImage = await this.modelClass.create({
      session_id: sessionId,
      record_id: pduIndex,
      record_index: 1,
      image_category: imageCategory,
      original_filename: info.originalName,
      stored_filename: info.stored,
      file_path: info.filePath,
      file_url: info.fileUrl,
      file_size: info.size,
      mime_type: info.mime,
      description,
      metadata: {
        pdu_index: pduIndex,
        category: imageCategory
      }
    });

    return { success: true, data: newImage };
  }

  // Delete all images for a PDU
  async deleteAllPDUImages(sessionId, pduIndex) {
    // Find all active images for this PDU
    const images = await this.modelClass.findAll({
      where: {
        session_id: sessionId,
        record_id: pduIndex,
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
    await this.modelClass.update(
      { is_active: false },
      {
        where: {
          session_id: sessionId,
          record_id: pduIndex,
          is_active: true
        }
      }
    );

    return { success: true, message: `All images for PDU ${pduIndex + 1} deleted` };
  }

  // Delete all images for a session
  async deleteAllSessionImages(sessionId) {
    // Find all active images for this session
    const images = await this.modelClass.findAll({
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
    await this.modelClass.update(
      { is_active: false },
      {
        where: {
          session_id: sessionId,
          is_active: true
        }
      }
    );

    return { success: true, message: `All images for session ${sessionId} deleted` };
  }
}

module.exports = new ExternalDCDistributionImageService(); 