const NewMW = require('../models/NewMW');
const fsSync = require('fs'); 
const NewMWImage = require('../models/NewMWImage');
const path = require('path');

class NewMWService {
  static async getMWsWithImages(sessionId) {
    const mws = await NewMW.findAll({ where: { session_id: sessionId } });
    const images = await NewMWImage.findAll({ where: { session_id: sessionId } });
    // Group images by mw_index
    const imagesByMW = {};
    images.forEach(img => {
      if (!imagesByMW[img.mw_index]) imagesByMW[img.mw_index] = [];
      imagesByMW[img.mw_index].push(img);
    });
    // If there are MW records, attach images to each MW
    if (mws.length > 0) {
      return mws.map(mw => ({
        ...mw.toJSON(),
        images: imagesByMW[mw.mw_index] || []
      }));
    }

    // If no MW records, but images exist, return images grouped by mw_index
    if (images.length > 0) {
      return Object.keys(imagesByMW).map(key => ({
        mw_index: parseInt(key, 10),
        images: imagesByMW[key]
      }));
    }

    // No data found
    return [];
  }

  static async saveMWsWithImages(sessionId, body, files) {
    // Parse fields (assume body.fields is a JSON string with all MWs)
    let mwData = [];
    if (body && body.fields) {
      try {
        mwData = JSON.parse(body.fields);
      } catch (err) {
        // If JSON parsing fails, throw a descriptive error
        throw new Error('Invalid JSON in fields payload');
      }
    }
    // Remove old MWs for this session
    await NewMW.destroy({ where: { session_id: sessionId } });
    // Save new MWs
    for (const mw of mwData) {
      await NewMW.create({
        session_id: sessionId,
        mw_index: mw.mw_index,
        fields: mw.fields
      });
    }
    // Handle images (replace if the same category already exists)
    if (files) {
      const fs = require('fs');
      const uploadsBaseDir = path.join(__dirname, '../uploads');

      for (const [field, fileArr] of Object.entries(files)) {
        for (const file of fileArr) {
          // Parse mw_index from field name, e.g., mw_1_front
          const match = field.match(/mw_(\\d+)_/);
          const mw_index = match ? parseInt(match[1], 10) : 1;

          // Determine file URL relative path (keeping same directory structure as upload middleware)
          const fileUrl = '/uploads/new_mw/' + file.filename;

          // Check if there is already an image for this session, index and category
          const existing = await NewMWImage.findOne({
            where: {
              session_id: sessionId,
              mw_index,
              image_category: field
            }
          });

          if (existing) {
            // Delete old file from disk if it exists
            try {
              const oldFilePath = path.join(uploadsBaseDir, 'new_mw', existing.stored_filename);
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
              }
            } catch (err) {
              // Log but don't block operation if deletion fails
              console.error('Failed to delete old image file:', err.message);
            }

            // Update existing record
            existing.original_filename = file.originalname;
            existing.stored_filename = file.filename;
            existing.file_url = fileUrl;
            await existing.save();
          } else {
            // Create new record
            await NewMWImage.create({
              session_id: sessionId,
              mw_index,
              image_category: field,
              original_filename: file.originalname,
              stored_filename: file.filename,
              file_url: fileUrl
            });
          }
        }
      }
    }
    return await this.getMWsWithImages(sessionId);
  }
}

module.exports = NewMWService;