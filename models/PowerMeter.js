const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PowerMeter = sequelize.define('PowerMeter', {
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
  
  // Power meter basic information
  serial_number: {
    type: DataTypes.STRING(100),
    defaultValue: '',
    validate: {
      len: [0, 100]
    }
  },
  
  meter_reading: {
    type: DataTypes.FLOAT,
    defaultValue: null,
    validate: {
      min: 0
    }
  },
  
  // AC power source type (Three phase / Single phase)
  ac_power_source_type: {
    type: DataTypes.ENUM('three_phase', 'single_phase'),
    defaultValue: null,
    validate: {
      isIn: [['three_phase', 'single_phase']]
    }
  },
  
  // Power cable specifications
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
  
  // Main CB (Circuit Breaker) specifications
  main_cb_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidCBConfig(value) {
        if (value === null) return;
        
        if (value.rating !== undefined && (isNaN(value.rating) || value.rating < 0)) {
          throw new Error('CB rating must be a positive number');
        }
        
        if (value.type !== undefined && !['three_phase', 'single_phase'].includes(value.type)) {
          throw new Error('CB type must be either three_phase or single_phase');
        }
      }
    }
  },
  
  // Electrical measurements
  electrical_measurements: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidElectricalMeasurements(value) {
        if (value === null) return;
        
        // All electrical measurement fields are optional, so no strict validation needed
        const validFields = [
          'existing_phase_1_voltage', 'existing_phase_2_voltage', 'existing_phase_3_voltage',
          'existing_phase_1_current', 'existing_phase_2_current', 'existing_phase_3_current',
          'sharing_phase_1_current', 'sharing_phase_2_current', 'sharing_phase_3_current',
          'phase_to_phase_l1_l2', 'phase_to_phase_l1_l3', 'phase_to_phase_l2_l3',
          'earthing_to_neutral_voltage'
        ];
        
        // Check if all keys are valid
        const invalidKeys = Object.keys(value).filter(key => !validFields.includes(key));
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid electrical measurement fields: ${invalidKeys.join(', ')}`);
        }
      }
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
  tableName: 'power_meter',
  timestamps: false // We're handling timestamps manually
});

// Add hooks for automatic timestamp management
PowerMeter.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = PowerMeter; 