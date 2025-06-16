const DCPowerSystem = require('../models/DCPowerSystem');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class DCPowerSystemService {
  
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
   * Get or create DC Power System record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await DCPowerSystem.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData, numberOfCabinets);
        
        if (record) {
          // Update existing record
          await record.update({
            number_of_cabinets: numberOfCabinets,
            dc_power_data: processedData.dcPowerData
          });
          await record.reload();
        } else {
          // Create new record
          record = await DCPowerSystem.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            dc_power_data: processedData.dcPowerData
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await DCPowerSystem.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          dc_power_data: this.getDefaultDCPowerData()
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
      dcPowerData: {
        // DC Rectifiers section
        dc_rectifiers: {
          existing_dc_rectifiers_location: this.validateDropdown(data.existing_dc_rectifiers_location),
          existing_dc_rectifiers_vendor: this.validateVendor(data.existing_dc_rectifiers_vendor),
          existing_dc_rectifiers_model: data.existing_dc_rectifiers_model || '',
          how_many_existing_dc_rectifier_modules: this.validateDropdown(data.how_many_existing_dc_rectifier_modules, 1, 20),
          rectifier_module_capacity: this.validateNumber(data.rectifier_module_capacity),
          total_capacity_existing_dc_power_system: this.validateNumber(data.total_capacity_existing_dc_power_system),
          how_many_free_slot_available_rectifier: this.validateDropdown(data.how_many_free_slot_available_rectifier, 1, 10)
        },
        
        // Batteries section
        batteries: {
          existing_batteries_strings_location: this.validateDropdown(data.existing_batteries_strings_location),
          existing_batteries_vendor: this.validateBatteryVendor(data.existing_batteries_vendor),
          existing_batteries_type: this.validateRadioButton(data.existing_batteries_type, ['Lead acid', 'Lithium']),
          how_many_existing_battery_string: this.validateDropdown(data.how_many_existing_battery_string, 1, 10),
          total_battery_capacity: this.validateNumber(data.total_battery_capacity),
          how_many_free_slot_available_battery: this.validateDropdown(data.how_many_free_slot_available_battery, 1, 10),
          new_battery_string_installation_location: this.validateCheckboxArray(data.new_battery_string_installation_location)
        }
      }
    };
    return processed;
  }
  
  /**
   * Validate radio button selection
   */
  static validateRadioButton(value, validOptions) {
    if (value && !validOptions.includes(value)) {
      throw new Error(`Value must be one of: ${validOptions.join(', ')}`);
    }
    return value || '';
  }
  
  /**
   * Validate dropdown selection
   */
  static validateDropdown(value, min = null, max = null) {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    // If it's a number range validation
    if (min !== null && max !== null) {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < min || numValue > max) {
        throw new Error(`Value must be between ${min} and ${max}`);
      }
      return numValue;
    }
    
    return value;
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
   * Validate battery vendor selection
   */
  static validateBatteryVendor(vendor) {
    const validVendors = ['Elore', 'Enersys', 'Leoch battery', 'Narada', 'Polarium', 'Shoto', 'Other', ''];
    
    if (vendor && !validVendors.includes(vendor)) {
      throw new Error(`Battery vendor must be one of: ${validVendors.join(', ')}`);
    }
    
    return vendor || '';
  }
  
  /**
   * Validate checkbox array
   */
  static validateCheckboxArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
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
   * Get default DC power system data structure
   */
  static getDefaultDCPowerData() {
    return {
      dc_rectifiers: {
        existing_dc_rectifiers_location: '',
        existing_dc_rectifiers_vendor: '',
        existing_dc_rectifiers_model: '',
        how_many_existing_dc_rectifier_modules: 1,
        rectifier_module_capacity: 0,
        total_capacity_existing_dc_power_system: 0,
        how_many_free_slot_available_rectifier: 1
      },
      batteries: {
        existing_batteries_strings_location: '',
        existing_batteries_vendor: '',
        existing_batteries_type: '',
        how_many_existing_battery_string: 1,
        total_battery_capacity: 0,
        how_many_free_slot_available_battery: 1,
        new_battery_string_installation_location: []
      }
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
    let dcPowerData = data.dc_power_data;
    
    // Ensure all fields exist with defaults
    const defaultData = this.getDefaultDCPowerData();
    dcPowerData = {
      dc_rectifiers: {
        existing_dc_rectifiers_location: dcPowerData?.dc_rectifiers?.existing_dc_rectifiers_location || defaultData.dc_rectifiers.existing_dc_rectifiers_location,
        existing_dc_rectifiers_vendor: dcPowerData?.dc_rectifiers?.existing_dc_rectifiers_vendor || defaultData.dc_rectifiers.existing_dc_rectifiers_vendor,
        existing_dc_rectifiers_model: dcPowerData?.dc_rectifiers?.existing_dc_rectifiers_model || defaultData.dc_rectifiers.existing_dc_rectifiers_model,
        how_many_existing_dc_rectifier_modules: dcPowerData?.dc_rectifiers?.how_many_existing_dc_rectifier_modules || defaultData.dc_rectifiers.how_many_existing_dc_rectifier_modules,
        rectifier_module_capacity: dcPowerData?.dc_rectifiers?.rectifier_module_capacity || defaultData.dc_rectifiers.rectifier_module_capacity,
        total_capacity_existing_dc_power_system: dcPowerData?.dc_rectifiers?.total_capacity_existing_dc_power_system || defaultData.dc_rectifiers.total_capacity_existing_dc_power_system,
        how_many_free_slot_available_rectifier: dcPowerData?.dc_rectifiers?.how_many_free_slot_available_rectifier || defaultData.dc_rectifiers.how_many_free_slot_available_rectifier
      },
      batteries: {
        existing_batteries_strings_location: dcPowerData?.batteries?.existing_batteries_strings_location || defaultData.batteries.existing_batteries_strings_location,
        existing_batteries_vendor: dcPowerData?.batteries?.existing_batteries_vendor || defaultData.batteries.existing_batteries_vendor,
        existing_batteries_type: dcPowerData?.batteries?.existing_batteries_type || defaultData.batteries.existing_batteries_type,
        how_many_existing_battery_string: dcPowerData?.batteries?.how_many_existing_battery_string || defaultData.batteries.how_many_existing_battery_string,
        total_battery_capacity: dcPowerData?.batteries?.total_battery_capacity || defaultData.batteries.total_battery_capacity,
        how_many_free_slot_available_battery: dcPowerData?.batteries?.how_many_free_slot_available_battery || defaultData.batteries.how_many_free_slot_available_battery,
        new_battery_string_installation_location: Array.isArray(dcPowerData?.batteries?.new_battery_string_installation_location) ? dcPowerData.batteries.new_battery_string_installation_location : defaultData.batteries.new_battery_string_installation_location
      }
    };
    
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets,
      dcPowerData: dcPowerData,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_rectifier_modules: dcPowerData.dc_rectifiers.how_many_existing_dc_rectifier_modules || 0,
        total_battery_strings: dcPowerData.batteries.how_many_existing_battery_string || 0,
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete DC Power System record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const deletedCount = await DCPowerSystem.destroy({
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
        message: 'DC Power System record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = DCPowerSystemService; 