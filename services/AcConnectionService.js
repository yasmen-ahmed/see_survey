const AcConnectionInfo = require('../models/AcConnectionInfo');
const Survey = require('../models/Survey');

class AcConnectionService {
  
  /**
   * Get or create AC connection info for a session
   * This implements the single endpoint pattern for both GET and PUT
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      // Validate session exists
      await this.validateSession(sessionId);
      
      // Find existing record
      let record = await AcConnectionInfo.findOne({ 
        where: { session_id: sessionId } 
      });
      
      if (updateData) {
        // PUT operation - create or update
        if (record) {
          // Update existing record
          const processedData = this.processUpdateData(updateData);
          await record.update(processedData);
          record.reload(); // Refresh from database
        } else {
          // Create new record
          const processedData = this.processUpdateData(updateData);
          record = await AcConnectionInfo.create({
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
      power_sources: data.power_sources || [],
      diesel_config: null,
      solar_config: null
    };
    
    // Process diesel generator configuration
    if (processed.power_sources.includes('diesel_generator') && data.diesel_config) {
      processed.diesel_config = this.processDieselConfig(data.diesel_config);
    }
    
    // Process solar cell configuration
    if (processed.power_sources.includes('solar_cell') && data.solar_config) {
      processed.solar_config = this.processSolarConfig(data.solar_config);
    }
    
    return processed;
  }
  
  /**
   * Process diesel generator configuration
   */
  static processDieselConfig(dieselData) {
    const config = {
      count: dieselData.count,
      generators: []
    };
    
    // Validate and process generators
    for (let i = 0; i < dieselData.count; i++) {
      const generator = dieselData.generators?.[i];
      if (!generator) {
        throw new Error(`Generator ${i + 1} configuration is required`);
      }
      
      config.generators.push({
        capacity: parseFloat(generator.capacity),
        status: generator.status,
        name: `Generator ${i + 1}`
      });
    }
    
    return config;
  }
  
  /**
   * Process solar cell configuration
   */
  static processSolarConfig(solarData) {
    return {
      capacity: parseFloat(solarData.capacity),
      type: solarData.type || 'standard'
    };
  }
  
  /**
   * Transform database record to API response format
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    
    return {
      session_id: data.session_id,
      power_sources: data.power_sources || [],
      diesel_config: data.diesel_config,
      solar_config: data.solar_config,
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
      power_sources: [],
      diesel_config: null,
      solar_config: null,
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

module.exports = AcConnectionService; 