const PowerMeter = require('../models/PowerMeter');
const Survey = require('../models/Survey');

class PowerMeterService {
  
  /**
   * Get or create Power Meter info for a session
   * This implements the single endpoint pattern for both GET and PUT
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      // Validate session exists
      await this.validateSession(sessionId);
      
      // Find existing record
      let record = await PowerMeter.findOne({ 
        where: { session_id: sessionId } 
      });
      
      if (updateData) {
        // PUT operation - create or update
        if (record) {
          // Update existing record
          const processedData = this.processUpdateData(updateData);
          await record.update(processedData);
          await record.reload(); // Refresh from database
        } else {
          // Create new record
          const processedData = this.processUpdateData(updateData);
          record = await PowerMeter.create({
            session_id: sessionId,
            ...processedData
          });
        }
      } else if (!record) {
        // GET operation - return defaults if no record exists
        return this.getDefaultResponse();
      }
      
      // Transform database record to API response format
      return this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Validate that session exists in survey table
   */
  static async validateSession(sessionId) {
    const survey = await Survey.findOne({ where: { session_id: sessionId } });
    if (!survey) {
      throw new Error(`Survey with session_id '${sessionId}' not found. Please create a survey first.`);
    }
    return survey;
  }
  
  /**
   * Process and validate update data
   */
  static processUpdateData(data) {
    const processed = {
      serial_number: data.serial_number || '',
      meter_reading: data.meter_reading || null,
      ac_power_source_type: data.ac_power_source_type || null,
      power_cable_config: null,
      main_cb_config: null
    };
    
    // Process power cable configuration
    if (data.power_cable_config) {
      processed.power_cable_config = this.processPowerCableConfig(data.power_cable_config);
    }
    
    // Process main CB configuration
    if (data.main_cb_config) {
      processed.main_cb_config = this.processMainCBConfig(data.main_cb_config);
    }
    
    return processed;
  }
  
  /**
   * Process power cable configuration
   */
  static processPowerCableConfig(cableData) {
    const config = {};
    
    if (cableData.length !== undefined) {
      const length = parseFloat(cableData.length);
      if (isNaN(length) || length < 0) {
        throw new Error('Cable length must be a positive number');
      }
      config.length = length;
    }
    
    if (cableData.cross_section !== undefined) {
      const crossSection = parseFloat(cableData.cross_section);
      if (isNaN(crossSection) || crossSection < 0) {
        throw new Error('Cable cross section must be a positive number');
      }
      config.cross_section = crossSection;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Process main CB (Circuit Breaker) configuration
   */
  static processMainCBConfig(cbData) {
    const config = {};
    
    if (cbData.rating !== undefined) {
      const rating = parseFloat(cbData.rating);
      if (isNaN(rating) || rating < 0) {
        throw new Error('CB rating must be a positive number');
      }
      config.rating = rating;
    }
    
    if (cbData.type !== undefined) {
      if (!['three_phase', 'single_phase'].includes(cbData.type)) {
        throw new Error('CB type must be either three_phase or single_phase');
      }
      config.type = cbData.type;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Transform database record to API response format
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    
    return {
      session_id: data.session_id,
      serial_number: data.serial_number || '',
      meter_reading: data.meter_reading,
      ac_power_source_type: data.ac_power_source_type,
      power_cable_config: data.power_cable_config || {
        length: null,
        cross_section: null
      },
      main_cb_config: data.main_cb_config || {
        rating: null,
        type: null
      },
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
  }
  
  /**
   * Get default response when no record exists
   */
  static getDefaultResponse() {
    return {
      serial_number: '',
      meter_reading: null,
      ac_power_source_type: null,
      power_cable_config: {
        length: null,
        cross_section: null
      },
      main_cb_config: {
        rating: null,
        type: null
      },
      metadata: {
        created_at: null,
        updated_at: null
      }
    };
  }
  
  /**
   * Handle and format errors
   */
  static handleError(error) {
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return {
        type: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        errors: validationErrors
      };
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return {
        type: 'FOREIGN_KEY_ERROR',
        message: 'Invalid session_id reference',
        error: error.message
      };
    }
    
    return {
      type: 'SERVICE_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

module.exports = PowerMeterService; 