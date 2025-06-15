const RanEquipment = require('../models/RANEquipment');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class RanEquipmentService {
  
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
   * Get or create RAN equipment record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await RanEquipment.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData, numberOfCabinets);
        
        if (record) {
          // Update existing record
          await record.update({
            number_of_cabinets: numberOfCabinets,
            ran_equipment: processedData.ranEquipment
          });
          await record.reload();
        } else {
          // Create new record
          record = await RanEquipment.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            ran_equipment: processedData.ranEquipment
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await RanEquipment.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          ran_equipment: this.getDefaultRanEquipment()
        });
      }
      
      return this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Process and validate update data (single object)
   */
  static processUpdateData(data, numberOfCabinets) {
    const processed = {
      ranEquipment: {
        existing_location: data.existing_location || '',
        existing_vendor: this.validateVendor(data.existing_vendor),
        existing_type_model: Array.isArray(data.existing_type_model) ? data.existing_type_model : [],
        new_installation_location: Array.isArray(data.new_installation_location) ? data.new_installation_location : [],
        length_of_transmission_cable: data.length_of_transmission_cable !== undefined && data.length_of_transmission_cable !== null && data.length_of_transmission_cable !== '' ? parseFloat(data.length_of_transmission_cable) : 0
      }
    };
    return processed;
  }
  
  /**
   * Validate vendor selection
   */
  static validateVendor(vendor) {
    const validVendors = ['Nokia', 'Ericsson', 'Huawei', 'ZTE', 'Other', ''];
    
    if (vendor && !validVendors.includes(vendor)) {
      throw new Error(`Vendor must be one of: ${validVendors.join(', ')}`);
    }
    
    return vendor || '';
  }
  
  /**
   * Get default RAN equipment structure (single object)
   */
  static getDefaultRanEquipment() {
    return {
      existing_location: '',
      existing_vendor: '',
      existing_type_model: [],
      new_installation_location: [],
      length_of_transmission_cable: 0
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
      options.push('New Nokia cabinet', 'Other');
      
      return options;
    } catch (error) {
      console.warn(`Could not fetch cabinet options for session ${sessionId}:`, error.message);
      return ['Existing cabinet #1', 'New Nokia cabinet', 'Other'];
    }
  }
  
  /**
   * Transform database record to API response format (single object)
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    let ranEquipment = data.ran_equipment;
    // If the DB value is an array (old data), convert to default object
    if (Array.isArray(ranEquipment)) {
      ranEquipment = this.getDefaultRanEquipment();
    }
    // Ensure all fields exist
    ranEquipment = {
      existing_location: ranEquipment?.existing_location || '',
      existing_vendor: ranEquipment?.existing_vendor || '',
      existing_type_model: Array.isArray(ranEquipment?.existing_type_model) ? ranEquipment.existing_type_model : [],
      new_installation_location: Array.isArray(ranEquipment?.new_installation_location) ? ranEquipment.new_installation_location : [],
      length_of_transmission_cable: ranEquipment?.length_of_transmission_cable !== undefined && ranEquipment?.length_of_transmission_cable !== null && ranEquipment?.length_of_transmission_cable !== '' ? parseFloat(ranEquipment.length_of_transmission_cable) : 0
    };
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets,
      ranEquipment: ranEquipment,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_equipment_entries: data.number_of_cabinets || 0,
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete RAN equipment record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const deletedCount = await RanEquipment.destroy({
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
   * Get RAN equipment summary for a session
   */
  static async getEquipmentSummary(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const record = await RanEquipment.findOne({
        where: { session_id: sessionId }
      });
      
      if (!record) {
        return {
          session_id: sessionId,
          total_cabinets: 0,
          equipment_summary: []
        };
      }
      
      const data = record.toJSON();
      const equipment = data.ran_equipment || [];
      
      const summary = equipment.map(eq => ({
        cabinet_id: eq.cabinet_id,
        existing_location: eq.existing_location,
        existing_vendor: eq.existing_vendor,
        has_existing_equipment: !!(eq.existing_vendor && eq.existing_vendor !== ''),
        existing_models_count: eq.existing_type_model ? eq.existing_type_model.length : 0,
        new_installation_options_count: eq.new_installation_location ? eq.new_installation_location.length : 0
      }));
      
      return {
        session_id: sessionId,
        total_cabinets: data.number_of_cabinets || 0,
        equipment_summary: summary
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
        message: 'RAN equipment record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = RanEquipmentService; 