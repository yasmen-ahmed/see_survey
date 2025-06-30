const ExternalDCDistribution = require('../models/ExternalDCDistribution');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class ExternalDCDistributionService {
  
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
   * Get or create External DC Distribution record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await ExternalDCDistribution.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Validate that we have the required structure
        if (!updateData.externalDCData || !updateData.externalDCData.dc_pdus) {
          throw {
            type: 'VALIDATION_ERROR',
            message: 'Invalid data structure: externalDCData.dc_pdus is required'
          };
        }
        
        // Process and validate the update data
        const processedData = {
          has_separate_dc_pdu: updateData.externalDCData.has_separate_dc_pdu || '',
          pdu_count: updateData.externalDCData.dc_pdus.length,
          dc_pdus: updateData.externalDCData.dc_pdus.map((pdu, index) => ({
            ...pdu,
            pdu_number: index + 1
          }))
        };
        
        if (record) {
          // If number of PDUs decreased, delete excess PDU images
          const currentPDUs = record.dc_pdus?.length || 0;
          const newPDUs = processedData.dc_pdus.length;
          
          if (newPDUs < currentPDUs) {
            const ExternalDCDistributionImageService = require('./ExternalDCDistributionImageService');
            // Delete images for removed PDUs
            for (let i = newPDUs; i < currentPDUs; i++) {
              await ExternalDCDistributionImageService.deleteImagesBySessionAndNumber(sessionId, i + 1);
            }
          }

          // Update existing record
          await record.update({
            has_separate_dc_pdu: processedData.has_separate_dc_pdu,
            pdu_count: processedData.pdu_count,
            dc_pdus: processedData.dc_pdus
          });
          await record.reload();
        } else {
          // Create new record
          record = await ExternalDCDistribution.create({
            session_id: sessionId,
            has_separate_dc_pdu: processedData.has_separate_dc_pdu,
            pdu_count: processedData.pdu_count,
            dc_pdus: processedData.dc_pdus
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await ExternalDCDistribution.create({
          session_id: sessionId,
          has_separate_dc_pdu: '',
          pdu_count: 0,
          dc_pdus: []
        });
      }
      
      return await this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Validate string input
   */
  static validateString(value) {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value).trim();
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
   * Get cabinet options for dropdowns based on outdoor cabinets data
   */
  static async getCabinetOptions(sessionId) {
    try {
      const outdoorCabinets = await OutdoorCabinets.findOne({
        where: { session_id: sessionId }
      });
      
      if (!outdoorCabinets || !outdoorCabinets.cabinets) {
        return ['Cabinet 1 - BLVD 1'];
      }
      
      const options = [];
      const cabinets = outdoorCabinets.cabinets || [];
      
      cabinets.forEach((cabinet, cabinetIndex) => {
        const cabinetNumber = cabinetIndex + 1;
        
        // Add BLVD options
        if (cabinet.blvdCBsRatings && Array.isArray(cabinet.blvdCBsRatings)) {
          cabinet.blvdCBsRatings.forEach((blvd, blvdIndex) => {
            if (blvd.connected_load) {
              options.push(`Cabinet ${cabinetNumber} - BLVD ${blvdIndex + 1} (${blvd.connected_load})`);
            }
          });
        }
        
        // Add LLVD options
        if (cabinet.llvdCBsRatings && Array.isArray(cabinet.llvdCBsRatings)) {
          cabinet.llvdCBsRatings.forEach((llvd, llvdIndex) => {
            if (llvd.connected_load) {
              options.push(`Cabinet ${cabinetNumber} - LLVD ${llvdIndex + 1} (${llvd.connected_load})`);
            }
          });
        }
        
        // Add PDU options
        if (cabinet.pduCBsRatings && Array.isArray(cabinet.pduCBsRatings)) {
          cabinet.pduCBsRatings.forEach((pdu, pduIndex) => {
            if (pdu.connected_load) {
              options.push(`Cabinet ${cabinetNumber} - PDU ${pduIndex + 1} (${pdu.connected_load})`);
            }
          });
        }
      });
      
      return options.length > 0 ? options : ['Cabinet 1 - BLVD 1'];
    } catch (error) {
      console.warn(`Could not fetch cabinet options for session ${sessionId}:`, error.message);
      return ['Cabinet 1 - BLVD 1'];
    }
  }
  
  /**
   * Transform database record to API response format
   */
  static async transformToApiResponse(record) {
    const data = record.toJSON();
    let dc_pdus = data.dc_pdus || [];
    
    // Preserve all stored fields and ensure pdu_number
    dc_pdus = dc_pdus.map((pdu, index) => ({
      pdu_number: pdu.pdu_number || index + 1,
      ...pdu
    }));
    
    // Fetch images for each PDU
    const ExternalDCDistributionImageService = require('./ExternalDCDistributionImageService');
    for (let pdu of dc_pdus) {
      let imgs = await ExternalDCDistributionImageService.getImagesBySessionAndNumber(data.session_id, pdu.pdu_number);
      if (!Array.isArray(imgs)) imgs = [];
      pdu.images = imgs.length > 0 ? imgs.map(img => ({
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
      externalDCData: {
        has_separate_dc_pdu: data.has_separate_dc_pdu || '',
        how_many_dc_pdus: dc_pdus.length,
        dc_pdus: dc_pdus
      },
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_dc_pdus: dc_pdus.length,
        pdus_configured: dc_pdus.filter(pdu => pdu.cabinet_ref || pdu.dc_cb_fuse_rating).length,
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete External DC Distribution record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      // Delete all associated images first
      const ExternalDCDistributionImageService = require('./ExternalDCDistributionImageService');
      await ExternalDCDistributionImageService.deleteAllImagesBySessionId(sessionId);
      
      const deletedCount = await ExternalDCDistribution.destroy({
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
        message: 'External DC Distribution record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = ExternalDCDistributionService; 