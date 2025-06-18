const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcConnectionInfo = sequelize.define('AcConnectionInfo', {
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
  
  // AC power source types (normalized as JSON for better flexibility)
  power_sources: { 
    type: DataTypes.JSON, 
    defaultValue: [],
    validate: {
      isValidPowerSources(value) {
        const validSources = ['commercial_power', 'diesel_generator', 'solar_cell', 'other'];
        if (!Array.isArray(value)) {
          throw new Error('Power sources must be an array');
        }
        const invalidSources = value.filter(source => !validSources.includes(source));
        if (invalidSources.length > 0) {
          throw new Error(`Invalid power sources: ${invalidSources.join(', ')}`);
        }
      }
    }
  },
  
  // Diesel generator configuration
  diesel_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidDieselConfig(value) {
        if (value === null) return;
        
        const { count, generators } = value;
        if (!count || ![1, 2].includes(count)) {
          throw new Error('Diesel generator count must be 1 or 2');
        }
        
        if (!generators || !Array.isArray(generators) || generators.length !== count) {
          throw new Error(`Must provide exactly ${count} generator configurations`);
        }
        
        generators.forEach((gen, index) => {
          if (!gen.capacity || gen.capacity <= 0) {
            throw new Error(`Generator ${index + 1} capacity must be positive`);
          }
          if (!['active', 'standby', 'faulty', 'not_working'].includes(gen.status)) {
            throw new Error(`Generator ${index + 1} has invalid status`);
          }
        });
      }
    }
  },
  
  // Solar cell configuration
  solar_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidSolarConfig(value) {
        if (value === null) return;
        if (!value.capacity || value.capacity <= 0) {
          throw new Error('Solar capacity must be positive');
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
  tableName: 'ac_connection_info',
  timestamps: false, // We're handling timestamps manually
});

// Add hooks for automatic timestamp management
AcConnectionInfo.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = AcConnectionInfo; 