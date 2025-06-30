const { AcPanel, AcPanelImages } = require('../models/associations');
const Survey = require('../models/Survey');
const fs = require('fs').promises;
const path = require('path');

class AcPanelService {
  
  /**
   * Get or create AC Panel info for a session
   * This implements the single endpoint pattern for both GET and PUT
   */
  static async getOrCreateBySessionId(sessionId, updateData = null, imageFile = null) {
    try {
      // Validate session exists
      await this.validateSession(sessionId);
      
      // Find existing record with images
      let record = await AcPanel.findOne({ 
        where: { session_id: sessionId },
        include: [{
          model: AcPanelImages,
          as: 'images',
          where: { is_active: true },
          required: false
        }]
      });
      
      if (!record) {
        // Create new record with default values
        record = await AcPanel.create({
          session_id: sessionId,
          power_cable_config: null,
          main_cb_config: null,
          has_free_cbs: null,
          cb_fuse_data: [],
          free_cb_spaces: null
        });
        // Reload to get associations
        record = await AcPanel.findOne({
          where: { session_id: sessionId },
          include: [{
            model: AcPanelImages,
            as: 'images',
            where: { is_active: true },
            required: false
          }]
        });
      }

      // Handle data update if provided
      if (updateData && Object.keys(updateData).length > 0) {
        const processedData = this.processUpdateData(updateData);
        await record.update(processedData);
        record = await record.reload({
          include: [{
            model: AcPanelImages,
            as: 'images',
            where: { is_active: true },
            required: false
          }]
        });
      }

      // Handle image upload if provided
      if (imageFile) {
        const imageCategory = imageFile.fieldname;
        const timestamp = Date.now();
        const filename = `ac_panel_${timestamp}_${path.basename(imageFile.originalname).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'uploads', 'ac_panel');
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Find and deactivate existing image of the same category
        await AcPanelImages.update(
          { is_active: false },
          { 
            where: { 
              session_id: sessionId,
              table_id: record.id,
              image_category: imageCategory,
              is_active: true
            }
          }
        );
        
        // Save file to disk
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, imageFile.buffer);
        
        const imageData = {
          session_id: sessionId,
          table_id: record.id,
          image_category: imageCategory,
          original_filename: imageFile.originalname,
          stored_filename: filename,
          file_path: filePath,
          file_url: `/uploads/ac_panel/${filename}`,
          file_size: imageFile.size,
          mime_type: imageFile.mimetype,
          is_active: true
        };

        await AcPanelImages.create(imageData);

        // Reload record to get updated images
        record = await AcPanel.findOne({
          where: { session_id: sessionId },
          include: [{
            model: AcPanelImages,
            as: 'images',
            where: { is_active: true },
            required: false
          }]
        });
      }
      
      // Transform and return the response
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
      power_cable_config: null,
      main_cb_config: null,
      has_free_cbs: data.has_free_cbs !== undefined ? data.has_free_cbs : null,
      cb_fuse_data: data.cb_fuse_data || [],
      free_cb_spaces: data.free_cb_spaces || null
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
    
    if (cableData.length !== undefined && cableData.length !== null && cableData.length !== '') {
      const length = parseFloat(cableData.length);
      if (isNaN(length) || length < 0) {
        throw new Error('Cable length must be a positive number');
      }
      config.length = length;
    }
    
    if (cableData.cross_section !== undefined && cableData.cross_section !== null && cableData.cross_section !== '') {
      const crossSection = parseFloat(cableData.cross_section);
      if (isNaN(crossSection) || crossSection < 0) {
        throw new Error('Cable cross section must be a positive number');
      }
      config.cross_section = crossSection;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Process main CB configuration
   */
  static processMainCBConfig(cbData) {
    const config = {};
    
    if (cbData.rating !== undefined && cbData.rating !== null && cbData.rating !== '') {
      const rating = parseFloat(cbData.rating);
      if (isNaN(rating) || rating < 0) {
        throw new Error('Main CB rating must be a positive number');
      }
      config.rating = rating;
    }
    
    if (cbData.type !== undefined && cbData.type !== null && cbData.type !== '') {
      if (!['three_phase', 'single_phase'].includes(cbData.type)) {
        throw new Error('Main CB type must be either three_phase or single_phase');
      }
      config.type = cbData.type;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
  
  /**
   * Process CB/Fuse table data with dynamic column management
   */
  static processCBFuseData(cbFuseData) {
    if (!Array.isArray(cbFuseData)) {
      throw new Error('CB/Fuse data must be an array');
    }
    
    const processedData = cbFuseData.map((item, index) => {
      const processedItem = {
        id: item.id || index + 1,
        rating: null,
        connected_module: item.connected_module || ''
      };
      
      // Process rating
      if (item.rating !== undefined && item.rating !== null && item.rating !== '') {
        const rating = parseFloat(item.rating);
        if (isNaN(rating) || rating < 0) {
          throw new Error(`CB/Fuse item ${index + 1} rating must be a positive number`);
        }
        processedItem.rating = rating;
      }
      
      return processedItem;
    });
    
    // Remove empty items (items with no data)
    return processedData.filter(item => 
      item.rating !== null || 
      (item.connected_module && item.connected_module.trim() !== '')
    );
  }
  
  /**
   * Transform database record to API response format
   */
  static transformToApiResponse(record) {
    const data = record.toJSON();
    
    // Ensure cb_fuse_data has at least one item for frontend
    let cbFuseData = data.cb_fuse_data || [];
    if (cbFuseData.length === 0) {
      cbFuseData = [{ id: 1, rating: null, connected_module: '' }];
    }
    
    return {
      session_id: data.session_id,
      power_cable_config: data.power_cable_config || {
        length: null,
        cross_section: null
      },
      main_cb_config: data.main_cb_config || {
        rating: null,
        type: null
      },
      has_free_cbs: data.has_free_cbs,
      cb_fuse_data: cbFuseData,
      free_cb_spaces: data.free_cb_spaces,
      images: data.images || [],
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_cb_entries: cbFuseData.length
      }
    };
  }
  
  /**
   * Get default response when no record exists
   */
  static getDefaultResponse() {
    return {
      power_cable_config: {
        length: null,
        cross_section: null
      },
      main_cb_config: {
        rating: null,
        type: null
      },
      has_free_cbs: null,
      cb_fuse_data: [
        { id: 1, rating: null, connected_module: '' }
      ],
      free_cb_spaces: null,
      images: [],
      metadata: {
        created_at: null,
        updated_at: null,
        total_cb_entries: 1
      }
    };
  }
  
  /**
   * Add new CB/Fuse entry dynamically
   */
  static async addNewCBEntry(sessionId) {
    try {
      await this.validateSession(sessionId);
      
      const record = await AcPanel.findOne({ 
        where: { session_id: sessionId } 
      });
      
      if (!record) {
        throw new Error('AC Panel record not found for this session');
      }
      
      const currentData = record.cb_fuse_data || [];
      const newId = Math.max(...currentData.map(item => item.id || 0), 0) + 1;
      
      const newEntry = {
        id: newId,
        rating: null,
        connected_module: ''
      };
      
      const updatedData = [...currentData, newEntry];
      
      await record.update({ cb_fuse_data: updatedData });
      await record.reload();
      
      return this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Remove CB/Fuse entry by ID
   */
  static async removeCBEntry(sessionId, entryId) {
    try {
      await this.validateSession(sessionId);
      
      const record = await AcPanel.findOne({ 
        where: { session_id: sessionId } 
      });
      
      if (!record) {
        throw new Error('AC Panel record not found for this session');
      }
      
      const currentData = record.cb_fuse_data || [];
      const updatedData = currentData.filter(item => item.id !== entryId);
      
      // Ensure at least one entry remains
      if (updatedData.length === 0) {
        updatedData.push({ id: 1, rating: null, connected_module: '' });
      }
      
      await record.update({ cb_fuse_data: updatedData });
      await record.reload();
      
      return this.transformToApiResponse(record);
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Handle and format errors
   */
  static handleError(error) {
    console.error('AC Panel Service Error:', error);
    
    if (error.message.includes('must be an array')) {
      return {
        type: 'VALIDATION_ERROR',
        message: error.message
      };
    }
    
    if (error.message.includes('not found')) {
      return {
        type: 'FOREIGN_KEY_ERROR',
        message: error.message
      };
    }
    
    return {
      type: 'SERVICE_ERROR',
      message: error.message
    };
  }
}

module.exports = AcPanelService; 