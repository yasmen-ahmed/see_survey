const OutdoorCabinets = require('../models/OutdoorCabinets');
const OutdoorCabinetsImageService = require('./OutdoorCabinetsImageService');

class OutdoorCabinetsService {
  
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
   * Get or create outdoor cabinets record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Try to find existing record
      let record = await OutdoorCabinets.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData);
        
        if (record) {
          // Update existing record
          await record.update({
            number_of_cabinets: processedData.numberOfCabinets,
            cabinets: processedData.cabinets
          });
          await record.reload();
        } else {
          // Create new record
          record = await OutdoorCabinets.create({
            session_id: sessionId,
            number_of_cabinets: processedData.numberOfCabinets,
            cabinets: processedData.cabinets
          });
        }
      } else if (!record) {
        // Create default record if none exists - start with 1 cabinet
        record = await OutdoorCabinets.create({
          session_id: sessionId,
          number_of_cabinets: 1,
          cabinets: this.getDefaultCabinets()
        });
      }
      
      return this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Process and validate update data
   */
  static processUpdateData(data) {
    const processed = {
      numberOfCabinets: null,
      cabinets: []
    };
    
    // Process number of cabinets
    if (data.numberOfCabinets !== undefined) {
      const numCabinets = parseInt(data.numberOfCabinets);
      if (!isNaN(numCabinets) && numCabinets >= 1 && numCabinets <= 10) {
        processed.numberOfCabinets = numCabinets;
      } else if (data.numberOfCabinets !== null && data.numberOfCabinets !== '') {
        throw new Error('Number of cabinets must be between 1 and 10');
      }
    }
    
    // Process cabinets data
    if (data.cabinets && Array.isArray(data.cabinets)) {
      processed.cabinets = this.processCabinetsData(data.cabinets);
    }
    
    return processed;
  }
  
  /**
   * Process cabinets array data with validation
   */
  static processCabinetsData(cabinetsData) {
    if (!Array.isArray(cabinetsData)) {
      throw new Error('Cabinets data must be an array');
    }
    
    return cabinetsData.map((cabinet, index) => {
      const processedCabinet = {
        id: cabinet.id || index + 1,
        type: Array.isArray(cabinet.type) ? cabinet.type : [],
        vendor: cabinet.vendor || '',
        model: cabinet.model || '',
        antiTheft: cabinet.antiTheft || '',
        coolingType: cabinet.coolingType || '',
        coolingCapacity: this.processNumericField(cabinet.coolingCapacity, `Cabinet ${index + 1} cooling capacity`),
        compartments: cabinet.compartments || '',
        hardware: Array.isArray(cabinet.hardware) ? cabinet.hardware : [],
        acPowerFeed: cabinet.acPowerFeed || '',
        cbNumber: cabinet.cbNumber || '',
        powerCableLength: this.processNumericField(cabinet.powerCableLength, `Cabinet ${index + 1} power cable length`),
        powerCableCrossSection: this.processNumericField(cabinet.powerCableCrossSection, `Cabinet ${index + 1} power cable cross section`),
        blvd: cabinet.blvd || '',
        blvdFreeCBs: cabinet.blvdFreeCBs || '',
        blvdCBsRatings: this.processCBRatingsData(cabinet.blvdCBsRatings, `Cabinet ${index + 1} BLVD`),
        llvd: cabinet.llvd || '',
        llvdFreeCBs: cabinet.llvdFreeCBs || '',
        llvdCBsRatings: this.processCBRatingsData(cabinet.llvdCBsRatings, `Cabinet ${index + 1} LLVD`),
        pdu: cabinet.pdu || '',
        pduFreeCBs: cabinet.pduFreeCBs || '',
        pduCBsRatings: this.processCBRatingsData(cabinet.pduCBsRatings, `Cabinet ${index + 1} PDU`),
        internalLayout: cabinet.internalLayout || '',
        freeU: this.processNumericField(cabinet.freeU, `Cabinet ${index + 1} free U`)
      };
      
      return processedCabinet;
    });
  }
  
  /**
   * Process numeric field with validation
   */
  static processNumericField(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      throw new Error(`${fieldName} must be a positive number`);
    }
    
    return numValue;
  }
  
  /**
   * Process CB ratings data
   */
  static processCBRatingsData(ratingsData, fieldContext) {
    if (!ratingsData || !Array.isArray(ratingsData)) {
      return [];
    }
    
    return ratingsData.map((entry, index) => {
      const processedEntry = {
        id: entry.id || index + 1,
        rating: null,
        connected_load: entry.connected_load || ''
      };
      
      // Process rating
      if (entry.rating !== undefined && entry.rating !== null && entry.rating !== '') {
        const rating = parseFloat(entry.rating);
        if (isNaN(rating) || rating < 0) {
          throw new Error(`${fieldContext} CB entry ${index + 1} rating must be a positive number`);
        }
        processedEntry.rating = rating;
      }
      
      return processedEntry;
    }).filter(entry => 
      entry.rating !== null || 
      (entry.connected_load && entry.connected_load.trim() !== '')
    );
  }
  
  /**
   * Get default cabinet structure
   */
  static getDefaultCabinets() {
    // Default to 1 cabinet instead of 10
    return [{
      id: 1,
      type: [],
      vendor: '',
      model: '',
      antiTheft: '',
      coolingType: '',
      coolingCapacity: null,
      compartments: '',
      hardware: [],
      acPowerFeed: '',
      cbNumber: '',
      powerCableLength: null,
      powerCableCrossSection: null,
      blvd: '',
      blvdFreeCBs: '',
      blvdCBsRatings: [],
      llvd: '',
      llvdFreeCBs: '',
      llvdCBsRatings: [],
      pdu: '',
      pduFreeCBs: '',
      pduCBsRatings: [],
      internalLayout: '',
      freeU: null
    }];
  }
  
  /**
   * Transform database record to API response format
   */
  static async transformToApiResponse(record) {
    const data = record.toJSON();
    
    // Get the number of cabinets configured
    const numberOfCabinets = data.number_of_cabinets || 1;
    
    // Start with saved cabinets or default
    let cabinets = data.cabinets || this.getDefaultCabinets();
    
    // Ensure we have the right number of cabinet slots based on numberOfCabinets
    if (cabinets.length < numberOfCabinets) {
      // Add missing cabinet slots
      for (let i = cabinets.length; i < numberOfCabinets; i++) {
        cabinets.push({
          id: i + 1,
          type: [],
          vendor: '',
          model: '',
          antiTheft: '',
          coolingType: '',
          coolingCapacity: null,
          compartments: '',
          hardware: [],
          acPowerFeed: '',
          cbNumber: '',
          powerCableLength: null,
          powerCableCrossSection: null,
          blvd: '',
          blvdFreeCBs: '',
          blvdCBsRatings: [],
          llvd: '',
          llvdFreeCBs: '',
          llvdCBsRatings: [],
          pdu: '',
          pduFreeCBs: '',
          pduCBsRatings: [],
          internalLayout: '',
          freeU: null
        });
      }
    }

    // Fetch images for each cabinet
    const cabinetsWithImages = await Promise.all(cabinets.map(async (cabinet, index) => {
      const images = await OutdoorCabinetsImageService.getImagesBySessionAndNumber(data.session_id, cabinet.id);
      return {
        ...cabinet,
        images: images.map(img => ({
          id: img.id,
          category: img.image_category,
          url: img.file_url
        }))
      };
    }));

    return {
      success: true,
      data: {
        session_id: data.session_id,
        numberOfCabinets,
        cabinets: cabinetsWithImages
      }
    };
  }
  
  /**
   * Delete cabinet data and associated images
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      // Delete images first
      await OutdoorCabinetsImageService.deleteAllImagesBySessionId(sessionId);
      
      // Delete cabinet data
      const result = await OutdoorCabinets.destroy({
        where: { session_id: sessionId }
      });
      
      return {
        success: true,
        message: `Deleted outdoor cabinets data for session ${sessionId}`,
        recordsDeleted: result
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get cabinet summary for a session
   */
  static async getCabinetSummary(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const record = await OutdoorCabinets.findOne({
        where: { session_id: sessionId }
      });
      
      if (!record) {
        return {
          session_id: sessionId,
          total_cabinets: 0,
          cabinet_summary: []
        };
      }
      
      const data = record.toJSON();
      const activeCabinets = data.cabinets.slice(0, data.number_of_cabinets || 0);
      
      const summary = activeCabinets.map(cabinet => ({
        id: cabinet.id,
        type: cabinet.type,
        vendor: cabinet.vendor,
        model: cabinet.model,
        has_ac_power: cabinet.acPowerFeed === 'Yes',
        has_blvd: cabinet.blvd === 'Yes',
        has_llvd: cabinet.llvd === 'Yes',
        has_pdu: cabinet.pdu === 'Yes',
        free_u_spaces: cabinet.freeU
      }));
      
      return {
        session_id: sessionId,
        total_cabinets: data.number_of_cabinets || 0,
        cabinet_summary: summary
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
        message: 'Outdoor cabinets record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = OutdoorCabinetsService; 