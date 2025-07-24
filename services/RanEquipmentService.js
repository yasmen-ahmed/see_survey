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
      
      // Always get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await RanEquipment.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData, numberOfCabinets);
        
        if (record) {
          // Update existing record with latest cabinet count
          await record.update({
            number_of_cabinets: numberOfCabinets,
            ran_equipment: processedData.ranEquipment
          });
          await record.reload();
        } else {
          // Create new record with latest cabinet count
          record = await RanEquipment.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            ran_equipment: processedData.ranEquipment
          });
        }
      } else if (!record) {
        // Create default record with latest cabinet count
        record = await RanEquipment.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          ran_equipment: this.getDefaultRanEquipment()
        });
      } else {
        // Update existing record with latest cabinet count even if no data update
        await record.update({
          number_of_cabinets: numberOfCabinets
        });
        await record.reload();
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
        // Existing fields
        existing_location: data.existing_location || '',
        existing_vendor: this.validateVendor(data.existing_vendor),
        existing_type_model: Array.isArray(data.existing_type_model) ? data.existing_type_model : [],
        new_installation_location: Array.isArray(data.new_installation_location) ? data.new_installation_location : [],
        length_of_transmission_cable: data.length_of_transmission_cable !== undefined && data.length_of_transmission_cable !== null && data.length_of_transmission_cable !== '' ? parseFloat(data.length_of_transmission_cable) : 0,
        // New BTS table fields
        how_many_base_band_onsite: parseInt(data.how_many_base_band_onsite) || 0,
        bts_table: Array.isArray(data.bts_table) ? data.bts_table.map(bts => ({
          base_band_technology: Array.isArray(bts.base_band_technology) ? bts.base_band_technology : [],
          existing_base_band_located_in_cabinet: bts.existing_base_band_located_in_cabinet || '',
          base_band_vendor: bts.base_band_vendor || '',
          base_band_model: bts.base_band_model || '',
          base_band_status: bts.base_band_status || '',
          transmission_cable_type: bts.transmission_cable_type || '',
          length_of_transmission_cable: bts.length_of_transmission_cable !== undefined && bts.length_of_transmission_cable !== null && bts.length_of_transmission_cable !== '' ? parseFloat(bts.length_of_transmission_cable) : 0,
          backhauling_destination: bts.backhauling_destination || ''
        })) : []
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
      // Existing fields
      existing_location: '',
      existing_vendor: '',
      existing_type_model: [],
      new_installation_location: [],
      length_of_transmission_cable: 0,
      // New BTS table fields
      how_many_base_band_onsite: 0,
      bts_table: []
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
    const defaultData = this.getDefaultRanEquipment();
    ranEquipment = {
      // Existing fields
      existing_location: ranEquipment?.existing_location || defaultData.existing_location,
      existing_vendor: ranEquipment?.existing_vendor || defaultData.existing_vendor,
      existing_type_model: Array.isArray(ranEquipment?.existing_type_model) ? ranEquipment.existing_type_model : defaultData.existing_type_model,
      new_installation_location: Array.isArray(ranEquipment?.new_installation_location) ? ranEquipment.new_installation_location : defaultData.new_installation_location,
      length_of_transmission_cable: ranEquipment?.length_of_transmission_cable !== undefined && ranEquipment?.length_of_transmission_cable !== null && ranEquipment?.length_of_transmission_cable !== '' ? parseFloat(ranEquipment.length_of_transmission_cable) : defaultData.length_of_transmission_cable,
      // New BTS table fields
      how_many_base_band_onsite: ranEquipment?.how_many_base_band_onsite || defaultData.how_many_base_band_onsite,
      bts_table: Array.isArray(ranEquipment?.bts_table) ? ranEquipment.bts_table.map(bts => ({
        base_band_technology: Array.isArray(bts.base_band_technology) ? bts.base_band_technology : [],
        existing_base_band_located_in_cabinet: bts.existing_base_band_located_in_cabinet || '',
        base_band_vendor: bts.base_band_vendor || '',
        base_band_model: bts.base_band_model || '',
        base_band_status: bts.base_band_status || '',
        transmission_cable_type: bts.transmission_cable_type || '',
        length_of_transmission_cable: bts.length_of_transmission_cable !== undefined && bts.length_of_transmission_cable !== null && bts.length_of_transmission_cable !== '' ? parseFloat(bts.length_of_transmission_cable) : 0,
        backhauling_destination: bts.backhauling_destination || ''
      })) : defaultData.bts_table
    };
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets, // Always use the latest cabinet count from database
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
   * Get technology options from Site Information
   */
  static async getTechnologyOptions(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      // Import SiteAreaInfo model dynamically to avoid circular dependencies
      const SiteAreaInfo = require('../models/SiteAreaInfo');
      
      const siteInfo = await SiteAreaInfo.findOne({
        where: { session_id: sessionId }
      });
      
      if (siteInfo && siteInfo.site_info && siteInfo.site_info.existing_technology) {
        // Parse the existing_technology field (it's stored as a string)
        let technologyOptions = [];
        try {
          if (typeof siteInfo.site_info.existing_technology === 'string') {
            technologyOptions = JSON.parse(siteInfo.site_info.existing_technology);
          } else if (Array.isArray(siteInfo.site_info.existing_technology)) {
            technologyOptions = siteInfo.site_info.existing_technology;
          }
        } catch (parseError) {
          console.warn('Error parsing existing_technology:', parseError);
          technologyOptions = [];
        }
        
        console.log('Found technology options in SiteAreaInfo:', technologyOptions);
        return technologyOptions.length > 0 ? technologyOptions : ['2G', '3G', '4G', '5G', 'Other'];
      }
      
      // Return default options if no site information found
      return ['2G', '3G', '4G', '5G', 'Other'];
      
    } catch (error) {
      console.warn(`Could not fetch technology options for session ${sessionId}:`, error.message);
      // Return default options on error
      return ['2G', '3G', '4G', '5G', 'Other'];
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