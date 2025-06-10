const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcPanel = sequelize.define('AcPanel', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // Ensure one record per session
    references: { 
      model: 'survey', 
      key: 'session_id' 
    },
    onDelete: 'CASCADE', // Clean up when survey is deleted
    onUpdate: 'CASCADE'
  },
  
  // Power cable configuration (from power meter to AC panel)
  power_cable_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidCableConfig(value) {
        if (value === null) return;
        
        if (value.length !== undefined && (isNaN(value.length) || value.length < 0)) {
          throw new Error('Cable length must be a positive number');
        }
        
        if (value.cross_section !== undefined && (isNaN(value.cross_section) || value.cross_section < 0)) {
          throw new Error('Cable cross section must be a positive number');
        }
      }
    }
  },
  
  // AC panel main CB configuration
  main_cb_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidMainCBConfig(value) {
        if (value === null) return;
        
        if (value.rating !== undefined && (isNaN(value.rating) || value.rating < 0)) {
          throw new Error('Main CB rating must be a positive number');
        }
        
        if (value.type !== undefined && !['three_phase', 'single_phase'].includes(value.type)) {
          throw new Error('Main CB type must be either three_phase or single_phase');
        }
      }
    }
  },
  
  // Does the AC panel have free CBs?
  has_free_cbs: {
    type: DataTypes.BOOLEAN,
    defaultValue: null
  },
  
  // Dynamic CB/Fuse table data
  cb_fuse_data: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidCBFuseData(value) {
        if (!Array.isArray(value)) {
          throw new Error('CB/Fuse data must be an array');
        }
        
        value.forEach((item, index) => {
          if (typeof item !== 'object' || item === null) {
            throw new Error(`CB/Fuse item ${index + 1} must be an object`);
          }
          
          if (item.rating !== undefined && item.rating !== null && (isNaN(item.rating) || item.rating < 0)) {
            throw new Error(`CB/Fuse item ${index + 1} rating must be a positive number`);
          }
          
          if (item.connected_module !== undefined && typeof item.connected_module !== 'string') {
            throw new Error(`CB/Fuse item ${index + 1} connected module must be a string`);
          }
        });
      }
    }
  },
  
  // Number of free spaces to add new AC CBs
  free_cb_spaces: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    validate: {
      min: 1,
      max: 5
    }
  },
  
  // Metadata for tracking
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
  
}, {
  tableName: 'ac_panel',
  timestamps: false, // We're handling timestamps manually
  indexes: [
    {
      unique: true,
      fields: ['session_id']
    }
  ]
});

// Add hooks for automatic timestamp management
AcPanel.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = AcPanel; 