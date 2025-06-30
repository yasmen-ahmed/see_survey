const MWAntennas = require('../models/MWAntennas');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class MWAntennasService {
  
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
   * Get or create MW Antennas record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await MWAntennas.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Validate that we have the required structure
        if (!updateData.mwAntennasData || !updateData.mwAntennasData.mw_antennas) {
          throw {
            type: 'VALIDATION_ERROR',
            message: 'Invalid data structure: mwAntennasData.mw_antennas is required'
          };
        }
        
        // Process and validate the update data
        const processedData = {
          how_many_mw_antennas_on_tower: updateData.how_many_mw_antennas_on_tower,
          mw_antennas: updateData.mwAntennasData.mw_antennas.map((antenna, index) => ({
            antenna_number: index + 1,
            height: this.validateNumber(antenna.height),
            diameter: this.validateNumber(antenna.diameter),
            azimuth: this.validateNumber(antenna.azimuth)
          }))
        };
        
        if (record) {
          // If number of antennas decreased, delete excess antenna images
          const currentAntennas = record.mw_antennas_data?.how_many_mw_antennas_on_tower || 1;
          const newAntennas = processedData.how_many_mw_antennas_on_tower;
          
          if (newAntennas < currentAntennas) {
            const MWAntennasImageService = require('./MWAntennasImageService');
            // Delete images for removed antennas
            for (let i = newAntennas + 1; i <= currentAntennas; i++) {
              await MWAntennasImageService.deleteImagesBySessionAndNumber(sessionId, i);
            }
          }

          // Update existing record
          await record.update({
            number_of_cabinets: numberOfCabinets,
            mw_antennas_data: processedData
          });
          await record.reload();
        } else {
          // Create new record
          record = await MWAntennas.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            mw_antennas_data: processedData
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await MWAntennas.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          mw_antennas_data: this.getDefaultMWAntennasData()
        });
      }
      
      return await this.transformToApiResponse(record);
      
    } catch (error) {
      console.error('Service error:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Process and validate update data
   */
  static processUpdateData(data, numberOfCabinets) {
    // Validate how many MW antennas (between 1 and 10)
    const howManyMWAntennas = Math.max(1, Math.min(10, parseInt(data.how_many_mw_antennas_on_tower) || 1));
    
    // Get antenna data from the request
    const antennaData = data.mwAntennasData?.mw_antennas || [];
    
    // Create MW antennas array based on the selected quantity
    const mwAntennas = [];
    
    // Process each antenna's data
    for (let i = 0; i < howManyMWAntennas; i++) {
      const antenna = {
        antenna_number: i + 1,
        height: this.validateNumber(antennaData[i]?.height),
        diameter: this.validateNumber(antennaData[i]?.diameter),
        azimuth: this.validateNumber(antennaData[i]?.azimuth)
      };
      mwAntennas.push(antenna);
    }
    
    return {
      mwAntennasData: {
        how_many_mw_antennas_on_tower: howManyMWAntennas,
        mw_antennas: mwAntennas.map(antenna => ({
          ...antenna,
          height: antenna.height || 0,
          diameter: antenna.diameter || 0,
          azimuth: antenna.azimuth || 0
        }))
      }
    };
  }
  
  /**
   * Create MW antennas array based on quantity
   */
  static createMWAntennasArray(data, quantity) {
    const antennas = [];
    
    for (let i = 1; i <= quantity; i++) {
      const antenna = {
        antenna_number: i,
        height: this.validateNumber(data[`mw_antenna_${i}_height`] || data.mw_antennas?.[i-1]?.height || 0),
        diameter: this.validateNumber(data[`mw_antenna_${i}_diameter`] || data.mw_antennas?.[i-1]?.diameter || 0),
        azimuth: this.validateNumber(data[`mw_antenna_${i}_azimuth`] || data.mw_antennas?.[i-1]?.azimuth || 0)
      };
      antennas.push(antenna);
    }
    
    return antennas;
  }
  
  /**
   * Validate dropdown selection with range
   */
  static validateDropdown(value, min = null, max = null) {
    if (value === undefined || value === null || value === '') {
      return min || 1; // Default to minimum or 1
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return min || 1;
    }
    
    if (min !== null && max !== null) {
      if (numValue < min) return min;
      if (numValue > max) return max;
      return numValue;
    }
    
    return numValue;
  }
  
  /**
   * Validate number input
   */
  static validateNumber(value) {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return 0;
    }
    
    return numValue;
  }
  
  /**
   * Get default MW antennas data structure
   */
  static getDefaultMWAntennasData() {
    return {
      how_many_mw_antennas_on_tower: 1,
      mw_antennas: [
        {
          antenna_number: 1,
          height: 0,
          diameter: 0,
          azimuth: 0
        }
      ]
    };
  }
  
  /**
   * Get cabinet options for dropdowns based on outdoor cabinets data
   */
  static async getCabinetOptions(sessionId) {
    try {
      const outdoorCabinets = await OutdoorCabinets.findOne({
        where: { session_id: sessionId }
      });
      
      if (!outdoorCabinets) {
        return ['Existing cabinet #1'];
      }
      
      const numberOfCabinets = outdoorCabinets.number_of_cabinets || 1;
      const options = [];
      
      // Add existing cabinet options
      for (let i = 1; i <= numberOfCabinets; i++) {
        options.push(`Existing cabinet #${i}`);
      }
      
      // Add additional options
      options.push('Other');
      
      return options;
    } catch (error) {
      console.warn(`Could not fetch cabinet options for session ${sessionId}:`, error.message);
      return ['Existing cabinet #1', 'Other'];
    }
  }
  
  /**
   * Transform database record to API response format
   */
  static async transformToApiResponse(record) {
    const data = record.toJSON();
    let mwAntennasData = data.mw_antennas_data;
    
    // Ensure all fields exist with defaults
    const defaultData = this.getDefaultMWAntennasData();
    
    // Validate the current data structure
    const howManyAntennas = mwAntennasData?.how_many_mw_antennas_on_tower || defaultData.how_many_mw_antennas_on_tower;
    
    // Ensure we have the correct number of antennas
    let antennas = [];
    if (Array.isArray(mwAntennasData?.mw_antennas)) {
      antennas = mwAntennasData.mw_antennas;
    }
    
    // Adjust array size to match the selected quantity
    while (antennas.length < howManyAntennas) {
      antennas.push({
        antenna_number: antennas.length + 1,
        height: 0,
        diameter: 0,
        azimuth: 0
      });
    }
    
    // Trim array if too many antennas
    if (antennas.length > howManyAntennas) {
      antennas = antennas.slice(0, howManyAntennas);
    }
    
    // Ensure antenna numbers are correct
    antennas = antennas.map((antenna, index) => ({
      antenna_number: index + 1,
      height: antenna.height || 0,
      diameter: antenna.diameter || 0,
      azimuth: antenna.azimuth || 0
    }));
    
    // Fetch images for each antenna
    const MWAntennasImageService = require('./MWAntennasImageService');
    for (let antenna of antennas) {
      let imgs = await MWAntennasImageService.getImagesBySessionAndNumber(data.session_id, antenna.antenna_number);
      if (!Array.isArray(imgs)) imgs = [];
      antenna.images = imgs.length > 0 ? imgs.map(img => ({
        id: img.id,
        image_category: img.image_category,
        file_url: img.file_url,
        original_filename: img.original_filename,
        description: img.description
      })) : [];
    }
    
    mwAntennasData = {
      how_many_mw_antennas_on_tower: howManyAntennas,
      mw_antennas: antennas
    };
    
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets,
      mwAntennasData: mwAntennasData,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_mw_antennas: howManyAntennas,
        antennas_configured: antennas.filter(ant => ant.height > 0 || ant.diameter > 0 || ant.azimuth > 0).length,
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete MW Antennas record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      // Delete all associated images first
      const MWAntennasImageService = require('./MWAntennasImageService');
      await MWAntennasImageService.deleteAllImagesBySessionId(sessionId);
      
      const deletedCount = await MWAntennas.destroy({
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
        message: 'MW Antennas record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = MWAntennasService; 