const AntennaStructure = require('../models/AntennaStructure');
const OutdoorCabinets = require('../models/OutdoorCabinets');

class AntennaStructureService {
  
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
   * Get or create Antenna Structure record by session ID
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      await this.validateSession(sessionId);
      
      // Get current number of cabinets from outdoor_cabinets table
      const numberOfCabinets = await this.getCabinetCount(sessionId);
      
      // Try to find existing record
      let record = await AntennaStructure.findOne({
        where: { session_id: sessionId }
      });
      
      if (updateData) {
        // Process and validate the update data
        const processedData = this.processUpdateData(updateData, numberOfCabinets);
        
        if (record) {
          // Update existing record
          await record.update({
            number_of_cabinets: numberOfCabinets,
            antenna_structure_data: processedData.antennaStructureData
          });
          await record.reload();
        } else {
          // Create new record
          record = await AntennaStructure.create({
            session_id: sessionId,
            number_of_cabinets: numberOfCabinets,
            antenna_structure_data: processedData.antennaStructureData
          });
        }
      } else if (!record) {
        // Create default record if none exists
        record = await AntennaStructure.create({
          session_id: sessionId,
          number_of_cabinets: numberOfCabinets,
          antenna_structure_data: this.getDefaultAntennaStructureData()
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
      antennaStructureData: {
        // Basic info
        has_sketch_with_measurements: this.validateRadioButton(data.has_sketch_with_measurements, ['Yes', 'No']),
        tower_type: this.validateCheckboxArray(data.tower_type),
        
        // GF Tower specific fields (conditional)
        gf_antenna_structure_height: this.validateNumber(data.gf_antenna_structure_height),
        
        // RT Tower specific fields (conditional)
        rt_how_many_structures_onsite: this.validateDropdown(data.rt_how_many_structures_onsite, 1, 10),
        rt_existing_heights: this.validateCheckboxArray(data.rt_existing_heights),
        rt_building_height: this.validateNumber(data.rt_building_height),
        
        // Common fields
        lightening_system_installed: this.validateRadioButton(data.lightening_system_installed, ['Yes', 'No']),
        earthing_bus_bars_exist: this.validateRadioButton(data.earthing_bus_bars_exist, ['Yes', 'No']),
        how_many_free_holes_bus_bars: this.validateDropdown(data.how_many_free_holes_bus_bars)
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
    
    // Handle specific dropdown values
    const specialValues = ['1 / 2 / 3 / ... / 10', 'more than 10'];
    if (specialValues.includes(value)) {
      return value;
    }
    
    // If it's a number range validation
    if (min !== null && max !== null) {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        return numValue;
      }
    }
    
    return value;
  }
  
  /**
   * Validate checkbox array (multiple selections)
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
   * Get default antenna structure data structure
   */
  static getDefaultAntennaStructureData() {
    return {
      has_sketch_with_measurements: '',
      tower_type: [],
      
      // GF Tower fields
      gf_antenna_structure_height: 0,
      
      // RT Tower fields
      rt_how_many_structures_onsite: '',
      rt_existing_heights: [],
      rt_building_height: 0,
      
      // Common fields
      lightening_system_installed: '',
      earthing_bus_bars_exist: '',
      how_many_free_holes_bus_bars: ''
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
    let antennaStructureData = data.antenna_structure_data;
    
    // Ensure all fields exist with defaults
    const defaultData = this.getDefaultAntennaStructureData();
    antennaStructureData = {
      has_sketch_with_measurements: antennaStructureData?.has_sketch_with_measurements || defaultData.has_sketch_with_measurements,
      tower_type: Array.isArray(antennaStructureData?.tower_type) ? antennaStructureData.tower_type : defaultData.tower_type,
      
      // GF Tower fields
      gf_antenna_structure_height: antennaStructureData?.gf_antenna_structure_height || defaultData.gf_antenna_structure_height,
      
      // RT Tower fields
      rt_how_many_structures_onsite: antennaStructureData?.rt_how_many_structures_onsite || defaultData.rt_how_many_structures_onsite,
      rt_existing_heights: Array.isArray(antennaStructureData?.rt_existing_heights) ? antennaStructureData.rt_existing_heights : defaultData.rt_existing_heights,
      rt_building_height: antennaStructureData?.rt_building_height || defaultData.rt_building_height,
      
      // Common fields
      lightening_system_installed: antennaStructureData?.lightening_system_installed || defaultData.lightening_system_installed,
      earthing_bus_bars_exist: antennaStructureData?.earthing_bus_bars_exist || defaultData.earthing_bus_bars_exist,
      how_many_free_holes_bus_bars: antennaStructureData?.how_many_free_holes_bus_bars || defaultData.how_many_free_holes_bus_bars
    };
    
    return {
      session_id: data.session_id,
      numberOfCabinets: data.number_of_cabinets,
      antennaStructureData: antennaStructureData,
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        tower_types_selected: antennaStructureData.tower_type.length || 0,
        has_gf_tower: antennaStructureData.tower_type.some(type => 
          ['GF tower', 'GF Monopole', 'GF Palm tree'].includes(type)
        ),
        has_rt_tower: antennaStructureData.tower_type.some(type => 
          ['RT tower', 'RT poles'].includes(type)
        ),
        synced_from_outdoor_cabinets: true
      }
    };
  }
  
  /**
   * Delete Antenna Structure record by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const deletedCount = await AntennaStructure.destroy({
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
        message: 'Antenna Structure record already exists for this session'
      };
    }
    
    // Generic error
    return {
      type: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = AntennaStructureService; 