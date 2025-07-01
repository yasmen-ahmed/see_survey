const express = require('express');
const router = express.Router();
const OutdoorGeneralLayoutService = require('../services/OutdoorGeneralLayoutService');
const OutdoorGeneralLayoutImageService = require('../services/OutdoorGeneralLayoutImageService');
const { uploadAnyWithErrorHandling } = require('../middleware/upload');

/**
 * Main endpoint for Outdoor General Layout Info
 * GET: Retrieve data (returns defaults if no data exists)
 * PUT: Create or update data
 */
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
      
      const data = await OutdoorGeneralLayoutService.getOrCreateBySessionId(session_id);
      
      // Fetch associated images
      const images = await OutdoorGeneralLayoutImageService.getImagesBySessionId(session_id);
      console.log(`Retrieved ${images.length} images for session ${session_id}`);
      
      const responseData = {
        ...data,
        images: images.map(img => ({
          id: img.id,
          category: img.image_category,
          url: img.file_url,
          original_filename: img.original_filename
        }))
      };
      
      res.json({
        success: true,
        data: responseData
      });
      
    } catch (error) {
      console.error('Outdoor General Layout GET Error:', error);
      
      const statusCode = error.type === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  })
  .put(uploadAnyWithErrorHandling, async (req, res) => {
    try {
      const { session_id } = req.params;
      let updateData;
      
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
      
      // Handle different request types: form-data vs JSON
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Parse form-data request
        if (req.body.data) {
          // Case 1: JSON data in 'data' field
          try {
            updateData = JSON.parse(req.body.data);
          } catch (parseError) {
            return res.status(400).json({
              success: false,
              error: {
                type: 'INVALID_BODY',
                message: 'Invalid JSON in data field'
              }
            });
          }
        } else {
          // Case 2: Individual form fields
          updateData = {};
          
          // Extract and parse form fields
          if (req.body.equipment_area_sunshade !== undefined) {
            updateData.equipment_area_sunshade = req.body.equipment_area_sunshade;
          }
          if (req.body.free_positions_available !== undefined) {
            updateData.free_positions_available = req.body.free_positions_available;
          }
          if (req.body.cable_tray_config !== undefined) {
            try {
              updateData.cable_tray_config = JSON.parse(req.body.cable_tray_config);
            } catch {
              updateData.cable_tray_config = req.body.cable_tray_config;
            }
          }
          if (req.body.cable_tray_space_available !== undefined) {
            updateData.cable_tray_space_available = req.body.cable_tray_space_available;
          }
          if (req.body.earth_bus_bar_config !== undefined) {
            try {
              updateData.earth_bus_bar_config = JSON.parse(req.body.earth_bus_bar_config);
            } catch {
              updateData.earth_bus_bar_config = req.body.earth_bus_bar_config;
            }
          }
          if (req.body.has_site_sketch !== undefined) {
            updateData.has_site_sketch = req.body.has_site_sketch === 'true' || req.body.has_site_sketch === true;
          }
        }
      } else {
        // Case 3: Regular JSON request
        updateData = req.body;
      }
      
      // Validate request data - allow requests with either data OR files
      const hasData = updateData && Object.keys(updateData).length > 0;
      const hasFiles = req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0);
      
      if (!hasData && !hasFiles) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_BODY',
            message: 'Request must contain either data fields or files'
          }
        });
      }
      
      console.log('Processing outdoor general layout request:', {
        session_id,
        hasData,
        hasFiles,
        updateData: hasData ? updateData : 'No data provided',
        fileCount: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : 0,
        fileNames: req.files ? (Array.isArray(req.files) ? req.files.map(f => f.fieldname) : Object.keys(req.files)) : []
      });
      
      // Update the main data (only if we have data to update)
      const data = hasData 
        ? await OutdoorGeneralLayoutService.getOrCreateBySessionId(session_id, updateData)
        : await OutdoorGeneralLayoutService.getOrCreateBySessionId(session_id);
      
      // Handle image uploads if present
      let imageResults = [];
      if (req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0)) {
        // console.log('Raw req.files structure:', JSON.stringify(req.files, (key, value) => {
        //   if (key === 'buffer') return '[Buffer]';
        //   return value;
        // }, 2));
        
        // Handle both array and object formats from multer
        let filesToProcess = [];
        
        if (Array.isArray(req.files)) {
          // If req.files is an array, use the fieldname from each file
          console.log('Processing files as array');
          filesToProcess = req.files.map(file => ({
            fieldName: file.fieldname,
            file: file
          }));
        } else {
          // If req.files is an object, use the object keys
          console.log('Processing files as object');
          filesToProcess = Object.entries(req.files).map(([fieldName, fileArray]) => ({
            fieldName: fieldName,
            file: Array.isArray(fileArray) ? fileArray[0] : fileArray
          }));
        }
        
                 console.log('Files to process:', filesToProcess.map(item => item.fieldName));
         
         for (const { fieldName, file } of filesToProcess) {
           console.log(`Processing image field: "${fieldName}"`);
          
          if (file && file.size > 0) {
            try {
              const imageResult = await OutdoorGeneralLayoutImageService.replaceImage({
                file,
                session_id,
                image_category: fieldName,
                description: `Image for ${fieldName.replace(/_/g, ' ')}`
              });
              
              console.log(`Image saved: ${fieldName} -> ${imageResult.data.stored_filename}`);
              
              imageResults.push({
                category: fieldName,
                success: true,
                data: imageResult.data
              });
            } catch (imageError) {
              console.error(`Error processing image ${fieldName}:`, imageError);
              imageResults.push({
                category: fieldName,
                success: false,
                error: imageError.message
              });
            }
          }
        }
      }
      
      // Fetch updated data with images
      const images = await OutdoorGeneralLayoutImageService.getImagesBySessionId(session_id);
      console.log(`Final response contains ${images.length} images`);
      
      const responseData = {
        ...data,
        images: images.map(img => ({
          id: img.id,
          category: img.image_category,
          url: img.file_url,
          original_filename: img.original_filename
        }))
      };
      
      const response = {
        success: true,
        data: responseData,
        message: hasData 
          ? 'Outdoor general layout info updated successfully'
          : 'Outdoor general layout data retrieved successfully'
      };
      
      if (imageResults.length > 0) {
        response.imageResults = imageResults;
        const successfulImages = imageResults.filter(r => r.success).length;
        if (hasData) {
          response.message += ` with ${successfulImages} image(s) processed`;
        } else {
          response.message = `${successfulImages} image(s) uploaded successfully`;
        }
      }
      
      res.json(response);
      
    } catch (error) {
      console.error('Outdoor General Layout PUT Error:', error);
      
      let statusCode = 500;
      if (error.type === 'VALIDATION_ERROR') statusCode = 400;
      if (error.type === 'FOREIGN_KEY_ERROR') statusCode = 400;
      
      res.status(statusCode).json({
        success: false,
        error
      });
    }
  });


/**
 * Health check endpoint for this module
 */
router.get('/health/check', (req, res) => {
  res.json({
    success: true,
    module: 'outdoor-general-layout',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'multiple_cb_tables',
      'complex_configurations',
      'auto_column_generation',
      'cable_tray_management',
      'earth_bus_bar_config'
    ]
  });
});

module.exports = router; 