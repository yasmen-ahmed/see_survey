const OutdoorGeneralLayout = require('../models/OutdoorGeneralLayout');
const Survey = require('../models/Survey');

class OutdoorGeneralLayoutService {
  
  /**
   * Get or create Outdoor General Layout info for a session
   * This implements the single endpoint pattern for both GET and PUT
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      // Validate session exists
      await this.validateSession(sessionId);
      
      // Find existing record
      let record = await OutdoorGeneralLayout.findOne({ 
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
          record = await OutdoorGeneralLayout.create({
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
      equipment_area_sunshade: data.equipment_area_sunshade || null,
      free_positions_available: data.free_positions_available || null,
      cable_tray_config: null,
      cable_tray_space_available: data.cable_tray_space_available !== undefined ? data.cable_tray_space_available : null,
      earth_bus_bar_config: null,
      has_site_sketch: data.has_site_sketch !== undefined ? data.has_site_sketch : null
    };
    
    // Process cable tray configuration
    if (data.cable_tray_config) {
      processed.cable_tray_config = this.processCableTrayConfig(data.cable_tray_config);
    }
    
    // Process earth bus bar configuration
    if (data.earth_bus_bar_config) {
      processed.earth_bus_bar_config = this.processEarthBusBarConfig(data.earth_bus_bar_config);
    }
    
    return processed;
  }
  
  /**
   * Process cable tray configuration
   */
  static processCableTrayConfig(cableTrayData) {
    const config = {};
    
    if (cableTrayData.height !== undefined && cableTrayData.height !== null && cableTrayData.height !== '') {
      const height = parseFloat(cableTrayData.height);
      if (isNaN(height) || height < 0) {
        throw new Error('Cable tray height must be a positive number');
      }
      config.height = height;
    }
    
    if (cableTrayData.width !== undefined && cableTrayData.width !== null && cableTrayData.width !== '') {
      const width = parseFloat(cableTrayData.width);
      if (isNaN(width) || width < 0) {
        throw new Error('Cable tray width must be a positive number');
      }
      config.width = width;
    }
    
    if (cableTrayData.depth !== undefined && cableTrayData.depth !== null && cableTrayData.depth !== '') {
      const depth = parseFloat(cableTrayData.depth);
      if (isNaN(depth) || depth < 0) {
        throw new Error('Cable tray depth must be a positive number');
      }
      config.depth = depth;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Process earth bus bar configuration
   */
  static processEarthBusBarConfig(earthBusBarData) {
    const config = {};
    
    if (earthBusBarData.available_bars !== undefined && earthBusBarData.available_bars !== null && earthBusBarData.available_bars !== '') {
      const availableBars = parseInt(earthBusBarData.available_bars);
      if (isNaN(availableBars) || availableBars < 1 || availableBars > 3) {
        throw new Error('Available earth bus bars must be between 1 and 3');
      }
      config.available_bars = availableBars;
    }
    
    if (earthBusBarData.free_holes !== undefined && earthBusBarData.free_holes !== null && earthBusBarData.free_holes !== '') {
      const freeHoles = parseInt(earthBusBarData.free_holes);
      if (isNaN(freeHoles) || freeHoles < 1 || freeHoles > 3) {
        throw new Error('Free holes in bus bars must be between 1 and 3');
      }
      config.free_holes = freeHoles;
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
      equipment_area_sunshade: data.equipment_area_sunshade,
      free_positions_available: data.free_positions_available,
      cable_tray_config: data.cable_tray_config || {
        height: null,
        width: null,
        depth: null
      },
      cable_tray_space_available: data.cable_tray_space_available,
      earth_bus_bar_config: data.earth_bus_bar_config || {
        available_bars: null,
        free_holes: null
      },
      has_site_sketch: data.has_site_sketch,
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
      equipment_area_sunshade: null,
      free_positions_available: null,
      cable_tray_config: {
        height: null,
        width: null,
        depth: null
      },
      cable_tray_space_available: null,
      earth_bus_bar_config: {
        available_bars: null,
        free_holes: null
      },
      has_site_sketch: null,
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

module.exports = OutdoorGeneralLayoutService; 