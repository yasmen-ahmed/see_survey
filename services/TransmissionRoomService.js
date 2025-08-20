const TransmissionRoom = require('../models/TransmissionRoom');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class TransmissionRoomService {
  
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
   * Get or create Transmission Room record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await TransmissionRoom.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData, numberOfCabinets);
        
        if (record) {
          // Update existing record
          await record.update({
            number_of_cabinets: numberOfCabinets,
            transmission_data: processedData.transmissionData
          });
          await record.reload();
        } else {
          // Create new record
          record = await TransmissionRoom.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            transmission_data: processedData.transmissionData
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await TransmissionRoom.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          transmission_data: this.getDefaultTransmissionData()
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
  static processUpdateData(data, numberOfCabinets) {
    // Handle space_available field - it might come as an array of characters
    let spaceAvailable = data.space_available || '';
    if (Array.isArray(spaceAvailable)) {
      spaceAvailable = spaceAvailable.join('');
    }
    
    const processed = {
      transmissionData: {
        // Basic transmission info
        type_of_transmission: data.type_of_transmission || '',
        existing_transmission_base_band_location: data.existing_transmission_base_band_location || '',
        existing_transmission_equipment_vendor: data.existing_transmission_equipment_vendor || '',
        space_available: spaceAvailable,
        existing_odf_location: data.existing_odf_location || '',
        cable_length_odf_to_baseband: data.cable_length_odf_to_baseband || '',
        
        // ODF fiber cable info
        odf_fiber_cable_type: data.odf_fiber_cable_type || '',
        how_many_free_ports_odf: data.how_many_free_ports_odf || '',
        how_many_mw_link_exist: data.how_many_mw_link_exist || '',
        
        // MW Links array - dynamic based on how_many_mw_link_exist
        mw_links: this.processMWLinks(data.mw_links, data.how_many_mw_link_exist || 1)
      }
    };
    return processed;
  }
  
  /**
   * Process MW Links array based on the number specified
   */
  static processMWLinks(mwLinksData, numberOfLinks) {
    const links = [];
    const numLinks = parseInt(numberOfLinks) || 1;
    
    for (let i = 0; i < numLinks; i++) {
      const linkData = Array.isArray(mwLinksData) && mwLinksData[i] ? mwLinksData[i] : {};
      
      links.push({
        link_id: i + 1,
        located_in: linkData.located_in || '',
        mw_equipment_vendor: linkData.mw_equipment_vendor || '',
        idu_type: linkData.idu_type || '',
        card_type_model: linkData.card_type_model || '',
        destination_site_id: linkData.destination_site_id || '',
        mw_backhauling_type: linkData.mw_backhauling_type || '',
        ethernet_ports_used: linkData.ethernet_ports_used || '',
        ethernet_ports_free: linkData.ethernet_ports_free || ''
      });
    }
    
    return links;
  }
  
  /**
   * Get default transmission data structure
   */
  static getDefaultTransmissionData() {
    return {
      type_of_transmission: '',
      existing_transmission_base_band_location: '',
      existing_transmission_equipment_vendor: '',
      space_available: '',
      existing_odf_location: '',
      cable_length_odf_to_baseband: '',
      odf_fiber_cable_type: '',
      how_many_free_ports_odf: '',
      how_many_mw_link_exist: '',
      mw_links: [
        {
          link_id: 1,
          located_in: '',
          mw_equipment_vendor: '',
          idu_type: '',
          card_type_model: '',
          destination_site_id: '',
          mw_backhauling_type: '',
          ethernet_ports_used: '',
          ethernet_ports_free: ''
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
  static transformToApiResponse(record) {
    const data = record.toJSON();
    let transmissionData = data.transmission_data;
    
    // Ensure all fields exist with defaults
    transmissionData = {
      type_of_transmission: transmissionData?.type_of_transmission || '',
      existing_transmission_base_band_location: transmissionData?.existing_transmission_base_band_location || '',
      existing_transmission_equipment_vendor: transmissionData?.existing_transmission_equipment_vendor || '',
      space_available: transmissionData?.space_available || '',
      existing_odf_location: transmissionData?.existing_odf_location || '',
      cable_length_odf_to_baseband: transmissionData?.cable_length_odf_to_baseband || '',
      odf_fiber_cable_type: transmissionData?.odf_fiber_cable_type || '',
      how_many_free_ports_odf: transmissionData?.how_many_free_ports_odf || '',
      how_many_mw_link_exist: transmissionData?.how_many_mw_link_exist || '',
      mw_links: Array.isArray(transmissionData?.mw_links) ? transmissionData.mw_links : this.getDefaultTransmissionData().mw_links
    };
    
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets,
      transmissionData: transmissionData,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_mw_links: transmissionData.how_many_mw_link_exist || 1,
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete Transmission Room record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const deletedCount = await TransmissionRoom.destroy({
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
        message: 'Transmission room record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = TransmissionRoomService; 