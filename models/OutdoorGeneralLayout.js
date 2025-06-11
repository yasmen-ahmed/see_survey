const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutdoorGeneralLayout = sequelize.define('OutdoorGeneralLayout', {
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
  
  // General layout info
  equipment_area_sunshade: {
    type: DataTypes.ENUM('yes', 'no', 'partially'),
    defaultValue: null
  },
  
  free_positions_available: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    validate: {
      min: 0,
      max: 5
    }
  },
  
  // Cable tray specifications
  cable_tray_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidCableTrayConfig(value) {
        if (value === null) return;
        
        if (value.height !== undefined && (isNaN(value.height) || value.height < 0)) {
          throw new Error('Cable tray height must be a positive number');
        }
        
        if (value.width !== undefined && (isNaN(value.width) || value.width < 0)) {
          throw new Error('Cable tray width must be a positive number');
        }
        
        if (value.depth !== undefined && (isNaN(value.depth) || value.depth < 0)) {
          throw new Error('Cable tray depth must be a positive number');
        }
      }
    }
  },
  
  // Cable tray availability
  cable_tray_space_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: null
  },
  
  // Earth bus bar configuration
  earth_bus_bar_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidEarthBusBarConfig(value) {
        if (value === null) return;
        
        if (value.available_bars !== undefined && (isNaN(value.available_bars) || value.available_bars < 1 || value.available_bars > 3)) {
          throw new Error('Available earth bus bars must be between 1 and 3');
        }
        
        if (value.free_holes !== undefined && (isNaN(value.free_holes) || value.free_holes < 1 || value.free_holes > 3)) {
          throw new Error('Free holes in bus bars must be between 1 and 3');
        }
      }
    }
  },
  
  // Site measurements sketch availability
  has_site_sketch: {
    type: DataTypes.BOOLEAN,
    defaultValue: null
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
  tableName: 'outdoor_general_layout',
  timestamps: false, // We're handling timestamps manually
  indexes: [
    {
      unique: true,
      fields: ['session_id']
    }
  ]
});

// Add hooks for automatic timestamp management
OutdoorGeneralLayout.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = OutdoorGeneralLayout; 