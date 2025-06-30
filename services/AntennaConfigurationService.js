const AntennaConfiguration = require('../models/AntennaConfiguration');
const OutdoorCabinets = require('../models/OutdoorCabinets');
const AntennaImageService = require('./AntennaImageService');

class AntennaConfigurationService {
  
  /**
   * Validate session ID format and existence
   */
  static async validateSession(sessionId) {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Invalid session ID format'
      };
    }
    return sessionId.trim();
  }
  
  /**
   * Get number of cabinets from outdoor_cabinets table
   */
  static async getCabinetCount(sessionId) {
    try {
      const outdoorCabinets = await OutdoorCabinets.findOne({
        where: { session_id: sessionId }
      });
      
      return outdoorCabinets ? (outdoorCabinets.number_of_cabinets || 1) : 1;
    } catch (error) {
      console.warn(`Could not fetch cabinet count for session ${sessionId}:`, error.message);
      return 1; // Fallback to 1 cabinet
    }
  }
  
  /**
   * Get or create Antenna Configuration record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await AntennaConfiguration.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Validate that we have the required structure
        if (!updateData.antennas || !Array.isArray(updateData.antennas)) {
          throw {
            type: 'VALIDATION_ERROR',
            message: 'Invalid data structure: antennas array is required'
          };
        }
        
        // Process and validate the update data
        const processedData = {
          antenna_count: updateData.antenna_count || updateData.antennas.length,
          antennas: updateData.antennas.map((antenna, index) => ({
            ...antenna,
            antenna_number: index + 1
          }))
        };
        
        if (record) {
          // If number of antennas decreased, delete excess antenna images
          const currentAntennas = record.antennas?.length || 0;
          const newAntennas = processedData.antennas.length;
          
          if (newAntennas < currentAntennas) {
            // Delete images for removed antennas
            for (let i = newAntennas; i < currentAntennas; i++) {
              await AntennaImageService.deleteImagesBySessionAndNumber(sessionId, i + 1);
            }
          }

          // Update existing record
          await record.update({
            antenna_count: processedData.antenna_count,
            antennas: processedData.antennas
          });
          await record.reload();
        } else {
          // Create new record
          record = await AntennaConfiguration.create({
            session_id: sessionId,
            antenna_count: processedData.antenna_count,
            antennas: processedData.antennas
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await AntennaConfiguration.create({
          session_id: sessionId,
          antenna_count: 0,
          antennas: []
        });
      }
      
      return await this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Transform database record to API response format
   */
  static async transformToApiResponse(record) {
    const data = record.toJSON();
    let antennas = data.antennas || [];
    
    // Preserve all stored fields and ensure antenna_number
    antennas = antennas.map((antenna, index) => ({
      antenna_number: antenna.antenna_number || index + 1,
      ...antenna
    }));
    
    // Fetch images for each antenna
    for (let antenna of antennas) {
      let imgs = await AntennaImageService.getImagesBySessionAndNumber(data.session_id, antenna.antenna_number);
      if (!Array.isArray(imgs)) imgs = [];
      antenna.images = imgs.length > 0 ? imgs.map(img => ({
        id: img.id,
        image_category: img.image_category,
        file_url: img.file_url,
        original_filename: img.original_filename,
        description: img.description
      })) : [];
    }
    
    return {
      session_id: data.session_id,
      numberOfCabinets: await this.getCabinetCount(data.session_id),
      antenna_count: data.antenna_count || antennas.length,
      antennas: antennas,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_antennas: antennas.length,
        antennas_configured: antennas.filter(ant => ant.sector || ant.technology?.length).length,
        total_images: antennas.reduce((sum, ant) => sum + (ant.images?.length || 0), 0)
      }
    };
  }
  
  /**
   * Delete Antenna Configuration record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      // Delete all associated images first
      await AntennaImageService.deleteAllImagesBySessionId(sessionId);
      
      const deletedCount = await AntennaConfiguration.destroy({
        where: { session_id: sessionId }
      });
      
      return {
        deleted: deletedCount > 0,
        deletedCount
      };
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Handle and format errors consistently
   */
  static handleError(error) {
    // If it's already a formatted error, return it
    if (error.type) {
      return error;
    }
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return {
        type: 'VALIDATION_ERROR',
        message: error.errors.map(e => e.message).join(', '),
        details: error.errors
      };
    }
    
    // Handle Sequelize foreign key errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return {
        type: 'FOREIGN_KEY_ERROR',
        message: 'Invalid session reference'
      };
    }
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return {
        type: 'DUPLICATE_ERROR',
        message: 'Antenna Configuration record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = AntennaConfigurationService; 