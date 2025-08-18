const RoomDCPowerSystem = require('../models/RoomDCPowerSystem');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class RoomDCPowerSystemService {
  
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
   * Get or create Room DC Power System record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await RoomDCPowerSystem.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData, numberOfCabinets);
        
        if (record) {
          // Update existing record
          await record.update({
            number_of_cabinets: numberOfCabinets,
            room_dc_power_data: processedData.roomDCPowerData
          });
          await record.reload();
        } else {
          // Create new record
          record = await RoomDCPowerSystem.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            room_dc_power_data: processedData.roomDCPowerData
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await RoomDCPowerSystem.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          room_dc_power_data: this.getDefaultRoomDCPowerData()
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
    const processed = {
      roomDCPowerData: {
        // DC Rectifiers section
        dc_rectifiers: {
          existing_dc_rectifiers_location: data.dc_rectifiers?.existing_dc_rectifiers_location || '',
          existing_dc_rectifiers_vendor: data.dc_rectifiers?.existing_dc_rectifiers_vendor || '',
          existing_dc_rectifiers_model: data.dc_rectifiers?.existing_dc_rectifiers_model || '',
          how_many_existing_dc_rectifier_modules: parseInt(data.dc_rectifiers?.how_many_existing_dc_rectifier_modules) || 0,
          rectifier_module_capacity: parseFloat(data.dc_rectifiers?.rectifier_module_capacity) || 0,
          total_capacity_existing_dc_power_system: parseFloat(data.dc_rectifiers?.total_capacity_existing_dc_power_system) || 0,
          how_many_free_slot_available_rectifier: parseInt(data.dc_rectifiers?.how_many_free_slot_available_rectifier) || 0,
          dc_rectifier_condition: data.dc_rectifiers?.dc_rectifier_condition || '',
          rect_load_current_reading: parseFloat(data.dc_rectifiers?.rect_load_current_reading) || 0,
          existing_site_temperature: parseFloat(data.dc_rectifiers?.existing_site_temperature) || 0,
          blvd_in_dc_power_rack: data.dc_rectifiers?.blvd_in_dc_power_rack || '',
          llvd_in_dc_power_rack: data.dc_rectifiers?.llvd_in_dc_power_rack || '',
          pdu_in_dc_power_rack: data.dc_rectifiers?.pdu_in_dc_power_rack || '',
          free_cbs_blvd: data.dc_rectifiers?.free_cbs_blvd || '',
          free_cbs_llvd: data.dc_rectifiers?.free_cbs_llvd || '',
          free_cbs_pdu: data.dc_rectifiers?.free_cbs_pdu || '',
          free_slots_rectifier_modules: data.dc_rectifiers?.free_slots_rectifier_modules || ''
        },
        
        // Batteries section
        batteries: {
          existing_batteries_strings_location: Array.isArray(data.batteries?.existing_batteries_strings_location) 
            ? data.batteries.existing_batteries_strings_location 
            : [],
          existing_batteries_vendor: data.batteries?.existing_batteries_vendor || '',
          existing_batteries_type: data.batteries?.existing_batteries_type || '',
          how_many_existing_battery_string: parseInt(data.batteries?.how_many_existing_battery_string) || 0,
          total_battery_capacity: parseFloat(data.batteries?.total_battery_capacity) || 0,
          how_many_free_slot_available_battery: parseInt(data.batteries?.how_many_free_slot_available_battery) || 0,
          new_battery_string_installation_location: Array.isArray(data.batteries?.new_battery_string_installation_location) 
            ? data.batteries.new_battery_string_installation_location 
            : [],
          batteries_condition: data.batteries?.batteries_condition || '',
          new_battery_type: data.batteries?.new_battery_type || '',
          new_battery_capacity: parseFloat(data.batteries?.new_battery_capacity) || 0,
          new_battery_qty: parseInt(data.batteries?.new_battery_qty) || 0
        },

        // CB/Fuse data for different tables
        cb_fuse_data_blvd: Array.isArray(data.cb_fuse_data_blvd) ? data.cb_fuse_data_blvd : [],
        cb_fuse_data_llvd: Array.isArray(data.cb_fuse_data_llvd) ? data.cb_fuse_data_llvd : [],
        cb_fuse_data_pdu: Array.isArray(data.cb_fuse_data_pdu) ? data.cb_fuse_data_pdu : []
      }
    };

    // Validate the processed data
    if (processed.roomDCPowerData.dc_rectifiers) {
      const dc = processed.roomDCPowerData.dc_rectifiers;
      if (dc.how_many_existing_dc_rectifier_modules < 0 || dc.how_many_existing_dc_rectifier_modules > 20) {
        throw new Error('Number of existing DC rectifier modules must be between 0 and 20');
      }
      if (dc.how_many_free_slot_available_rectifier < 0 || dc.how_many_free_slot_available_rectifier > 10) {
        throw new Error('Number of free slots for rectifier must be between 0 and 10');
      }
    }

    if (processed.roomDCPowerData.batteries) {
      const bat = processed.roomDCPowerData.batteries;
      if (bat.how_many_existing_battery_string < 0 || bat.how_many_existing_battery_string > 10) {
        throw new Error('Number of existing battery strings must be between 0 and 10');
      }
      if (bat.how_many_free_slot_available_battery < 0 || bat.how_many_free_slot_available_battery > 10) {
        throw new Error('Number of free slots for battery must be between 0 and 10');
      }
      if (bat.total_battery_capacity < 0) {
        throw new Error('Total battery capacity cannot be negative');
      }
    }

    return processed;
  }
  
  /**
   * Get default Room DC power system data structure
   */
  static getDefaultRoomDCPowerData() {
    return {
      dc_rectifiers: {
        existing_dc_rectifiers_location: '',
        existing_dc_rectifiers_vendor: '',
        existing_dc_rectifiers_model: '',
        how_many_existing_dc_rectifier_modules: 1,
        rectifier_module_capacity: 0,
        total_capacity_existing_dc_power_system: 0,
        how_many_free_slot_available_rectifier: 1,
        dc_rectifier_condition: '',
        rect_load_current_reading: 0,
        existing_site_temperature: 0,
        blvd_in_dc_power_rack: '',
        llvd_in_dc_power_rack: '',
        pdu_in_dc_power_rack: '',
        free_cbs_blvd: '',
        free_cbs_llvd: '',
        free_cbs_pdu: '',
        free_slots_rectifier_modules: ''
      },
      batteries: {
        existing_batteries_strings_location: [],
        existing_batteries_vendor: '',
        existing_batteries_type: '',
        how_many_existing_battery_string: 1,
        total_battery_capacity: 0,
        how_many_free_slot_available_battery: 1,
        new_battery_string_installation_location: [],
        batteries_condition: '',
        new_battery_type: '',
        new_battery_capacity: 0,
        new_battery_qty: 0
      },
      cb_fuse_data_blvd: [],
      cb_fuse_data_llvd: [],
      cb_fuse_data_pdu: []
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
   * Transform database record to API response format
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    let roomDCPowerData = data.room_dc_power_data;
    
    // Ensure all fields exist with defaults
    const defaultData = this.getDefaultRoomDCPowerData();
    roomDCPowerData = {
      dc_rectifiers: {
        existing_dc_rectifiers_location: roomDCPowerData?.dc_rectifiers?.existing_dc_rectifiers_location || defaultData.dc_rectifiers.existing_dc_rectifiers_location,
        existing_dc_rectifiers_vendor: roomDCPowerData?.dc_rectifiers?.existing_dc_rectifiers_vendor || defaultData.dc_rectifiers.existing_dc_rectifiers_vendor,
        existing_dc_rectifiers_model: roomDCPowerData?.dc_rectifiers?.existing_dc_rectifiers_model || defaultData.dc_rectifiers.existing_dc_rectifiers_model,
        how_many_existing_dc_rectifier_modules: roomDCPowerData?.dc_rectifiers?.how_many_existing_dc_rectifier_modules || defaultData.dc_rectifiers.how_many_existing_dc_rectifier_modules,
        rectifier_module_capacity: roomDCPowerData?.dc_rectifiers?.rectifier_module_capacity || defaultData.dc_rectifiers.rectifier_module_capacity,
        total_capacity_existing_dc_power_system: roomDCPowerData?.dc_rectifiers?.total_capacity_existing_dc_power_system || defaultData.dc_rectifiers.total_capacity_existing_dc_power_system,
        how_many_free_slot_available_rectifier: roomDCPowerData?.dc_rectifiers?.how_many_free_slot_available_rectifier || defaultData.dc_rectifiers.how_many_free_slot_available_rectifier,
        dc_rectifier_condition: roomDCPowerData?.dc_rectifiers?.dc_rectifier_condition || defaultData.dc_rectifiers.dc_rectifier_condition,
        rect_load_current_reading: roomDCPowerData?.dc_rectifiers?.rect_load_current_reading || defaultData.dc_rectifiers.rect_load_current_reading,
        existing_site_temperature: roomDCPowerData?.dc_rectifiers?.existing_site_temperature || defaultData.dc_rectifiers.existing_site_temperature,
        blvd_in_dc_power_rack: roomDCPowerData?.dc_rectifiers?.blvd_in_dc_power_rack || defaultData.dc_rectifiers.blvd_in_dc_power_rack,
        llvd_in_dc_power_rack: roomDCPowerData?.dc_rectifiers?.llvd_in_dc_power_rack || defaultData.dc_rectifiers.llvd_in_dc_power_rack,
        pdu_in_dc_power_rack: roomDCPowerData?.dc_rectifiers?.pdu_in_dc_power_rack || defaultData.dc_rectifiers.pdu_in_dc_power_rack,
        free_cbs_blvd: roomDCPowerData?.dc_rectifiers?.free_cbs_blvd || defaultData.dc_rectifiers.free_cbs_blvd,
        free_cbs_llvd: roomDCPowerData?.dc_rectifiers?.free_cbs_llvd || defaultData.dc_rectifiers.free_cbs_llvd,
        free_cbs_pdu: roomDCPowerData?.dc_rectifiers?.free_cbs_pdu || defaultData.dc_rectifiers.free_cbs_pdu,
        free_slots_rectifier_modules: roomDCPowerData?.dc_rectifiers?.free_slots_rectifier_modules || defaultData.dc_rectifiers.free_slots_rectifier_modules
      },
      batteries: {
        existing_batteries_strings_location: Array.isArray(roomDCPowerData?.batteries?.existing_batteries_strings_location) ? roomDCPowerData.batteries.existing_batteries_strings_location : defaultData.batteries.existing_batteries_strings_location,
        existing_batteries_vendor: roomDCPowerData?.batteries?.existing_batteries_vendor || defaultData.batteries.existing_batteries_vendor,
        existing_batteries_type: roomDCPowerData?.batteries?.existing_batteries_type || defaultData.batteries.existing_batteries_type,
        how_many_existing_battery_string: roomDCPowerData?.batteries?.how_many_existing_battery_string || defaultData.batteries.how_many_existing_battery_string,
        total_battery_capacity: roomDCPowerData?.batteries?.total_battery_capacity || defaultData.batteries.total_battery_capacity,
        how_many_free_slot_available_battery: roomDCPowerData?.batteries?.how_many_free_slot_available_battery || defaultData.batteries.how_many_free_slot_available_battery,
        new_battery_string_installation_location: Array.isArray(roomDCPowerData?.batteries?.new_battery_string_installation_location) ? roomDCPowerData.batteries.new_battery_string_installation_location : defaultData.batteries.new_battery_string_installation_location,
        batteries_condition: roomDCPowerData?.batteries?.batteries_condition || defaultData.batteries.batteries_condition,
        new_battery_type: roomDCPowerData?.batteries?.new_battery_type || defaultData.batteries.new_battery_type,
        new_battery_capacity: roomDCPowerData?.batteries?.new_battery_capacity || defaultData.batteries.new_battery_capacity,
        new_battery_qty: roomDCPowerData?.batteries?.new_battery_qty || defaultData.batteries.new_battery_qty
      },
      cb_fuse_data_blvd: Array.isArray(roomDCPowerData?.cb_fuse_data_blvd) ? roomDCPowerData.cb_fuse_data_blvd : defaultData.cb_fuse_data_blvd,
      cb_fuse_data_llvd: Array.isArray(roomDCPowerData?.cb_fuse_data_llvd) ? roomDCPowerData.cb_fuse_data_llvd : defaultData.cb_fuse_data_llvd,
      cb_fuse_data_pdu: Array.isArray(roomDCPowerData?.cb_fuse_data_pdu) ? roomDCPowerData.cb_fuse_data_pdu : defaultData.cb_fuse_data_pdu
    };
    
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets,
      roomDCPowerData: roomDCPowerData,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_rectifier_modules: roomDCPowerData.dc_rectifiers.how_many_existing_dc_rectifier_modules || 0,
        total_battery_strings: roomDCPowerData.batteries.how_many_existing_battery_string || 0,
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete Room DC Power System record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const deletedCount = await RoomDCPowerSystem.destroy({
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
        message: 'Room DC Power System record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = RoomDCPowerSystemService; 