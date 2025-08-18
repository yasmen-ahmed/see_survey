const express = require('express');
const router = express.Router();
const RoomInfo = require('../models/RoomInfo');
const RoomInfoImages = require('../models/RoomInfoImages');
const Survey = require('../models/Survey');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');



// Main endpoint for Room Info
// GET: Retrieve data (returns defaults if no data exists)
// PUT: Create or update data with images
router.route('/:session_id')
  .get(async (req, res) => {
    try {
      const { session_id } = req.params;
      
      // Validate session_id parameter
      if (!session_id || session_id.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_PARAMETER',
            message: 'session_id is required'
          }
        });
      }
      
      // Validate session_id exists
      const survey = await Survey.findOne({ where: { session_id } });
      if (!survey) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_SESSION',
            message: 'Invalid session_id'
          }
        });
      }

      // Get room info data
      let roomInfo = await RoomInfo.findOne({ where: { session_id } });
      
      // Get room info images
      const images = await RoomInfoImages.findAll({ 
        where: { session_id },
        order: [['upload_date', 'DESC']]
      });

      // Return images as flat array (like RAN room)
      const imagesArray = images.map(image => ({
        id: image.id,
        image_category: image.category,
        original_filename: image.original_name || 'Unknown',
        stored_filename: image.filename,
        file_url: `/uploads/room_info/${image.filename}`,
        file_size: image.file_size,
        mime_type: image.mime_type,
        description: image.description,
        created_at: image.created_at,
        updated_at: image.updated_at
      }));

      // If no room info exists, return empty template
      if (!roomInfo) {
        roomInfo = {
          id: null,
          session_id,
          height: null,
          width: null,
          depth: null,
          hardware: [],
          sketch_available: null
        };
      }

      res.json({
        success: true,
        data: roomInfo,
        images: imagesArray
      });
    } catch (error) {
      console.error('Error fetching room info:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'SERVER_ERROR',
          message: error.message
        }
      });
    }
  })
  .put(uploadAnyWithErrorHandling, async (req, res) => {
    try {
      console.log('Processing Room Info PUT request:', {
        sessionId: req.params.session_id,
        files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })) : 'No files',
        body: req.body
      });
      
      // Log the current working directory and upload path
      console.log('Current working directory:', process.cwd());
      console.log('Upload directory path:', path.join(__dirname, '..', 'uploads', 'room_info'));

      const { session_id } = req.params;
      let updateData = {};
      
      // Validate session_id parameter
      if (!session_id || session_id.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_PARAMETER',
            message: 'session_id is required'
          }
        });
      }

      // Validate session_id exists
      const survey = await Survey.findOne({ where: { session_id } });
      if (!survey) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_SESSION',
            message: 'Invalid session_id'
          }
        });
      }

      // Handle form-data with JSON
      if (req.body.data) {
        try {
          updateData = JSON.parse(req.body.data);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: {
              type: 'INVALID_JSON',
              message: 'Invalid JSON in data field'
            }
          });
        }
      } else {
        // Handle individual form fields
        updateData = {
          height: req.body.height ? parseFloat(req.body.height) : null,
          width: req.body.width ? parseFloat(req.body.width) : null,
          depth: req.body.depth ? parseFloat(req.body.depth) : null,
          hardware: req.body.hardware ? JSON.parse(req.body.hardware) : [],
          sketch_available: req.body.sketch_available || null
        };
      }

      // Upsert room info
      const [roomInfo, created] = await RoomInfo.findOrCreate({
        where: { session_id },
        defaults: {
          session_id,
          height: updateData.height || null,
          width: updateData.width || null,
          depth: updateData.depth || null,
          hardware: updateData.hardware || [],
          sketch_available: updateData.sketch_available || null
        }
      });

      if (!created) {
        await roomInfo.update({
          height: updateData.height !== undefined ? updateData.height : roomInfo.height,
          width: updateData.width !== undefined ? updateData.width : roomInfo.width,
          depth: updateData.depth !== undefined ? updateData.depth : roomInfo.depth,
          hardware: updateData.hardware !== undefined ? updateData.hardware : roomInfo.hardware,
          sketch_available: updateData.sketch_available !== undefined ? updateData.sketch_available : roomInfo.sketch_available
        });
      }

      // Handle image uploads
      console.log('Files received:', req.files);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const imageCategory = file.fieldname;
          const timestamp = Date.now();
          const filename = `room_info_${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          // Create uploads directory if it doesn't exist
          const uploadDir = path.join(__dirname, '..', 'uploads', 'room_info');
          console.log('Upload directory:', uploadDir);
          console.log('Directory exists:', fs.existsSync(uploadDir));
          if (!fs.existsSync(uploadDir)) {
            console.log('Creating directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // Find existing image of the same category
          const existingImage = await RoomInfoImages.findOne({
            where: {
              session_id: session_id,
              category: imageCategory
            }
          });

          if (existingImage) {
            // Delete old file if it exists
            try {
              if (fs.existsSync(existingImage.file_path)) {
                fs.unlinkSync(existingImage.file_path);
              }
            } catch (err) {
              console.warn('Failed to delete old image file:', err);
            }
            
            // Delete old record
            await existingImage.destroy();
          }

          // Move file from temp location to final location
          const finalPath = path.join(uploadDir, filename);
          console.log('Copying file from:', file.path, 'to:', finalPath);
          console.log('Source file exists:', fs.existsSync(file.path));
          fs.copyFileSync(file.path, finalPath);
          console.log('File copied successfully. Final file exists:', fs.existsSync(finalPath));
          
          // Clean up temp file
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.warn('Failed to cleanup temp file:', err);
          }
          
          // Save image record
          await RoomInfoImages.create({
            session_id,
            category: imageCategory,
            filename: filename,
            original_name: file.originalname,
            file_path: finalPath,
            file_size: file.size,
            mime_type: file.mimetype
          });
          
          console.log('Saved image record:', {
            category: imageCategory,
            filename: filename,
            file_url: `/uploads/room_info/${filename}`,
            finalPath: finalPath
          });
        }
      }

      // Get updated images
      const images = await RoomInfoImages.findAll({ 
        where: { session_id },
        order: [['upload_date', 'DESC']]
      });

      // Return images as flat array (like RAN room)
      const imagesArray = images.map(image => ({
        id: image.id,
        image_category: image.category,
        original_filename: image.original_name || 'Unknown',
        stored_filename: image.filename,
        file_url: `/uploads/room_info/${image.filename}`,
        file_size: image.file_size,
        mime_type: image.mime_type,
        description: image.description,
        created_at: image.created_at,
        updated_at: image.updated_at
      }));

      console.log('Final response images:', imagesArray);
      res.json({
        success: true,
        message: created ? 'Room info created successfully' : 'Room info updated successfully',
        data: roomInfo,
        images: imagesArray
      });
    } catch (error) {
      console.error('Error updating room info:', error);
      res.status(400).json({
        success: false,
        error: {
          type: 'SERVER_ERROR',
          message: error.message
        }
      });
    }
  });

module.exports = router; 