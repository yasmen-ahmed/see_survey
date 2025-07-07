const { AcConnectionInfo, AcConnectionImages } = require('../models/associations');
const Survey = require('../models/Survey');
const fs = require('fs');
const path = require('path');

class AcConnectionService {
  
  /**
   * Get or create AC connection info for a session
   * This implements the single endpoint pattern for both GET and PUT
   */
  static async getOrCreateBySessionId(sessionId, updateData = null, imageFile = null) {
    try {
      // Validate session exists
      await this.validateSession(sessionId);
      
      // Find existing record with images
      let record = await AcConnectionInfo.findOne({ 
        where: { session_id: sessionId },
        include: [{
          model: AcConnectionImages,
          as: 'images',
          where: { is_active: true },
          required: false
        }]
      });
      
      // If no record exists, create one with default values
      if (!record) {
        record = await AcConnectionInfo.create({
          session_id: sessionId,
          power_sources: [],
          diesel_config: null,
          solar_config: null
        });
        // Reload to get associations
        record = await AcConnectionInfo.findOne({
          where: { session_id: sessionId },
          include: [{
            model: AcConnectionImages,
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
            model: AcConnectionImages,
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

          const imageCategory = imageFile.fieldname || 'generator_photo';
          const timestamp = Date.now();
          const filename = `ac_connection_${timestamp}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          // Create uploads directory if it doesn't exist
          const uploadDir = path.join(process.cwd(), 'uploads', 'ac_connection');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
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

          // Find and deactivate existing image of the same category
          const existingImage = await AcConnectionImages.findOne({
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
          
          const imageData = {
            session_id: sessionId,
            table_id: record.id,
            image_category: imageCategory,
            original_filename: imageFile.originalname,
            stored_filename: filename,
            file_path: finalPath,
            file_url: `/uploads/ac_connection/${filename}`,
            file_size: imageFile.size,
            mime_type: imageFile.mimetype,
            is_active: true
          };

          await AcConnectionImages.create(imageData);

          // Reload record to get updated images
          record = await AcConnectionInfo.findOne({
            where: { session_id: sessionId },
            include: [{
              model: AcConnectionImages,
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
      power_sources: data.power_sources || [],
      diesel_config: null,
      solar_config: null
    };
    
    // Process diesel generator configuration
    if (processed.power_sources.includes('diesel_generator') && data.diesel_config) {
      processed.diesel_config = this.processDieselConfig(data.diesel_config);
    }
    
    // Process solar cell configuration
    if (processed.power_sources.includes('solar_cell') && data.solar_config) {
      processed.solar_config = this.processSolarConfig(data.solar_config);
    }
    
    return processed;
  }
  
  /**
   * Process diesel generator configuration
   */
  static processDieselConfig(dieselData) {
    const config = {
      count: dieselData.count,
      generators: []
    };
    
    // Validate and process generators
    for (let i = 0; i < dieselData.count; i++) {
      const generator = dieselData.generators?.[i];
      if (!generator) {
        throw new Error(`Generator ${i + 1} configuration is required`);
      }
      
      config.generators.push({
        capacity: parseFloat(generator.capacity),
        status: generator.status,
        name: `Generator ${i + 1}`
      });
    }
    
    return config;
  }
  
  /**
   * Process solar cell configuration
   */
  static processSolarConfig(solarData) {
    return {
      capacity: parseFloat(solarData.capacity),
      type: solarData.type || 'standard'
    };
  }
  
  /**
   * Transform database record to API response format
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    
    return {
      session_id: data.session_id,
      power_sources: data.power_sources || [],
      diesel_config: data.diesel_config,
      solar_config: data.solar_config,
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
      power_sources: [],
      diesel_config: null,
      solar_config: null,
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

module.exports = AcConnectionService; 