const express = require('express');
const router = express.Router();
const RoomPreparation = require('../models/RoomPreparation');
const Survey = require('../models/Survey');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Main endpoint for Room Preparation
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

      // Get room preparation data
      let roomPreparation = await RoomPreparation.findOne({ where: { session_id } });
      
      // If no room preparation exists, return empty template
      if (!roomPreparation) {
        roomPreparation = {
          id: null,
          session_id,
          ac_type: null,
          ac_count: null,
          ac_capacity: null,
          ac_status: null,
          cable_tray_height: null,
          cable_tray_width: null,
          existing_cable_tray_space: null,
          available_space_in_feeder_window: null,
          feeder_free_holes: null,
          feeder_windows: null,
          bus_bar_free_holes: null,
          rack_free_positions: null,
          images: []
        };
      }

      res.json({
        success: true,
        data: roomPreparation
      });
    } catch (error) {
      console.error('Error fetching room preparation:', error);
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
      console.log('Processing Room Preparation PUT request:', {
        sessionId: req.params.session_id,
        files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })) : 'No files',
        body: req.body
      });

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
          ac_type: req.body.ac_type || null,
          ac_count: req.body.ac_count || null,
          ac_capacity: req.body.ac_capacity ? parseFloat(req.body.ac_capacity) : null,
          ac_status: req.body.ac_status || null,
          cable_tray_height: req.body.cable_tray_height ? parseFloat(req.body.cable_tray_height) : null,
          cable_tray_width: req.body.cable_tray_width ? parseFloat(req.body.cable_tray_width) : null,
          existing_cable_tray_space: req.body.existing_cable_tray_space || null,
          available_space_in_feeder_window: req.body.available_space_in_feeder_window || null,
          feeder_free_holes: req.body.feeder_free_holes ? parseInt(req.body.feeder_free_holes) : null,
          feeder_windows: req.body.feeder_windows ? parseInt(req.body.feeder_windows) : null,
          bus_bar_free_holes: req.body.bus_bar_free_holes ? parseInt(req.body.bus_bar_free_holes) : null,
          rack_free_positions: req.body.rack_free_positions ? parseInt(req.body.rack_free_positions) : null
        };
      }

      // Get existing room preparation to preserve images
      let roomPreparation = await RoomPreparation.findOne({ where: { session_id } });
      let existingImages = [];
      
      if (roomPreparation && roomPreparation.images) {
        existingImages = Array.isArray(roomPreparation.images) ? roomPreparation.images : [];
      }

      // Process uploaded images
      const uploadedImages = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const timestamp = Date.now();
          const filename = `room_preparation_${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          // Create uploads directory if it doesn't exist
          const uploadDir = path.join(process.cwd(), 'uploads', 'room_preparation');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // Move file from temp location to final location
          const finalPath = path.join(uploadDir, filename);
          fs.copyFileSync(file.path, finalPath);
          
          // Clean up temp file
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.warn('Failed to cleanup temp file:', err);
          }
          
          uploadedImages.push({
            category: file.fieldname,
            file_url: `/uploads/room_preparation/${filename}`,
            original_filename: file.originalname
          });
        }
      }

      // Merge existing and new images
      const finalImages = [...existingImages];
      
      // Replace existing images with same category or add new ones
      uploadedImages.forEach(newImg => {
        const existingIndex = finalImages.findIndex(img => img.category === newImg.category);
        if (existingIndex !== -1) {
          // Replace existing image
          finalImages[existingIndex] = newImg;
        } else {
          // Add new image
          finalImages.push(newImg);
        }
      });

      // Prepare data for upsert
      const roomPreparationData = {
        session_id,
        ac_type: updateData.ac_type || null,
        ac_count: updateData.ac_count || null,
        ac_capacity: updateData.ac_capacity || null,
        ac_status: updateData.ac_status || null,
        cable_tray_height: updateData.cable_tray_height || null,
        cable_tray_width: updateData.cable_tray_width || null,
        existing_cable_tray_space: updateData.existing_cable_tray_space || null,
        available_space_in_feeder_window: updateData.available_space_in_feeder_window || null,
        feeder_free_holes: updateData.feeder_free_holes || null,
        feeder_windows: updateData.feeder_windows || null,
        bus_bar_free_holes: updateData.bus_bar_free_holes || null,
        rack_free_positions: updateData.rack_free_positions || null,
        images: finalImages
      };

      // Upsert room preparation
      const [roomPreparationRecord, created] = await RoomPreparation.findOrCreate({
        where: { session_id },
        defaults: roomPreparationData
      });

      if (!created) {
        await roomPreparationRecord.update(roomPreparationData);
      }

      res.json({
        success: true,
        message: created ? 'Room preparation created successfully' : 'Room preparation updated successfully',
        data: roomPreparationRecord
      });
    } catch (error) {
      console.error('Error updating room preparation:', error);
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