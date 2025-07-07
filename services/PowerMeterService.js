const { PowerMeter, PowerMeterImages } = require('../models/associations');
const Survey = require('../models/Survey');
const fs = require('fs');
const path = require('path');

class PowerMeterService {
  
  /**
   * Get or create Power Meter info for a session
   * This implements the single endpoint pattern for both GET and PUT
   */
  static async getOrCreateBySessionId(sessionId, updateData = null, imageFile = null) {
    try {
      // Validate session exists
      await this.validateSession(sessionId);
      
      // Find existing record with images
      let record = await PowerMeter.findOne({ 
        where: { session_id: sessionId },
        include: [{
          model: PowerMeterImages,
          as: 'images',
          where: { is_active: true },
          required: false
        }]
      });
      
      if (!record) {
        // Create new record with default values
        record = await PowerMeter.create({
          session_id: sessionId,
          serial_number: '',
          meter_reading: null,
          ac_power_source_type: null,
          power_cable_config: null,
          main_cb_config: null
        });
        // Reload to get associations
        record = await PowerMeter.findOne({
          where: { session_id: sessionId },
          include: [{
            model: PowerMeterImages,
            as: 'images',
            where: { is_active: true },
            required: false
          }]
        });
      }

      // Handle data update if provided
      if (updateData && Object.keys(updateData).length > 0) {
        const processedData = this.processUpdateData(updateData);
        await record.update(processedData);
        record = await record.reload({
          include: [{
            model: PowerMeterImages,
            as: 'images',
            where: { is_active: true },
            required: false
          }]
        });
      }

      // Handle image upload if provided
      if (imageFile) {
        try {
          console.log('Processing image file:', {
            fieldname: imageFile.fieldname,
            originalname: imageFile.originalname,
            path: imageFile.path
          });

          const imageCategory = imageFile.fieldname || 'power_meter_photo';
          const timestamp = Date.now();
          const filename = `power_meter_${timestamp}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          // Create uploads directory if it doesn't exist
          const uploadDir = path.join(process.cwd(), 'uploads', 'power_meter');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Find and deactivate existing image of the same category
          const existingImage = await PowerMeterImages.findOne({
            where: {
              session_id: sessionId,
              table_id: record.id,
              image_category: imageCategory,
              is_active: true
            }
          });

          if (existingImage) {
            // Deactivate old image
            await existingImage.update({ is_active: false });
            
            // Delete old file if it exists
            try {
              if (fs.existsSync(existingImage.file_path)) {
                fs.unlinkSync(existingImage.file_path);
              }
            } catch (err) {
              console.warn('Failed to delete old image file:', err);
            }
          }

          // Move file from temp location to final location
          const finalPath = path.join(uploadDir, filename);
          fs.copyFileSync(imageFile.path, finalPath);
          
          // Clean up temp file
          try {
            fs.unlinkSync(imageFile.path);
          } catch (err) {
            console.warn('Failed to cleanup temp file:', err);
          }
          
          const imageData = {
            session_id: sessionId,
            table_id: record.id,
            image_category: imageCategory,
            original_filename: imageFile.originalname,
            stored_filename: filename,
            file_path: finalPath,
            file_url: `/uploads/power_meter/${filename}`,
            file_size: imageFile.size,
            mime_type: imageFile.mimetype,
            is_active: true
          };

          await PowerMeterImages.create(imageData);

          // Reload record to get updated images
          record = await PowerMeter.findOne({
            where: { session_id: sessionId },
            include: [{
              model: PowerMeterImages,
              as: 'images',
              where: { is_active: true },
              required: false
            }]
          });
        } catch (error) {
          console.error('Failed to process image:', error);
          throw new Error(`Failed to process image: ${error.message}`);
        }
      }
      
      // Transform and return the response
      return this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Validate that session exists in survey table
   */
  static async validateSession(sessionId) {
    const survey = await Survey.findOne({ where: { session_id: sessionId } });
    if (!survey) {
      throw new Error(`Survey with session_id '${sessionId}' not found. Please create a survey first.`);
    }
    return survey;
  }
  
  /**
   * Process and validate update data
   */
  static processUpdateData(data) {
    const processed = {
      serial_number: data.serial_number || '',
      meter_reading: data.meter_reading || null,
      ac_power_source_type: data.ac_power_source_type || null,
      power_cable_config: null,
      main_cb_config: null
    };
    
    // Process power cable configuration
    if (data.power_cable_config) {
      processed.power_cable_config = this.processPowerCableConfig(data.power_cable_config);
    }
    
    // Process main CB configuration
    if (data.main_cb_config) {
      processed.main_cb_config = this.processMainCBConfig(data.main_cb_config);
    }
    
    return processed;
  }
  
  /**
   * Process power cable configuration
   */
  static processPowerCableConfig(cableData) {
    const config = {};
    
    if (cableData.length !== undefined) {
      const length = parseFloat(cableData.length);
      if (isNaN(length) || length < 0) {
        throw new Error('Cable length must be a positive number');
      }
      config.length = length;
    }
    
    if (cableData.cross_section !== undefined) {
      const crossSection = parseFloat(cableData.cross_section);
      if (isNaN(crossSection) || crossSection < 0) {
        throw new Error('Cable cross section must be a positive number');
      }
      config.cross_section = crossSection;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Process main CB (Circuit Breaker) configuration
   */
  static processMainCBConfig(cbData) {
    const config = {};
    
    if (cbData.rating !== undefined) {
      const rating = parseFloat(cbData.rating);
      if (isNaN(rating) || rating < 0) {
        throw new Error('CB rating must be a positive number');
      }
      config.rating = rating;
    }
    
    if (cbData.type !== undefined) {
      if (!['three_phase', 'single_phase'].includes(cbData.type)) {
        throw new Error('CB type must be either three_phase or single_phase');
      }
      config.type = cbData.type;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Transform database record to API response format
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    
    return {
      session_id: data.session_id,
      serial_number: data.serial_number || '',
      meter_reading: data.meter_reading,
      ac_power_source_type: data.ac_power_source_type,
      power_cable_config: data.power_cable_config || {
        length: null,
        cross_section: null
      },
      main_cb_config: data.main_cb_config || {
        rating: null,
        type: null
      },
      images: data.images || [],
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
  }
  
  /**
   * Get default response when no record exists
   */
  static getDefaultResponse() {
    return {
      serial_number: '',
      meter_reading: null,
      ac_power_source_type: null,
      power_cable_config: {
        length: null,
        cross_section: null
      },
      main_cb_config: {
        rating: null,
        type: null
      },
      images: [],
      metadata: {
        created_at: null,
        updated_at: null
      }
    };
  }
  
  /**
   * Handle and format errors
   */
  static handleError(error) {
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return {
        type: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        errors: validationErrors
      };
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return {
        type: 'FOREIGN_KEY_ERROR',
        message: 'Invalid session_id reference',
        error: error.message
      };
    }
    
    return {
      type: 'SERVICE_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = PowerMeterService; 