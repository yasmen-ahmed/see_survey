const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RanEquipment = sequelize.define('RanEquipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Foreign key to session
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Session ID cannot be empty'
      }
    }
  },
  
  // Number of cabinets (synced from outdoor_cabinets table)
  number_of_cabinets: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: 1,
        msg: 'Number of cabinets must be at least 1'
      },
      max: {
        args: 10,
        msg: 'Number of cabinets cannot exceed 10'
      }
    }
  },
  
  // RAN equipment data as a single JSON object
  ran_equipment: {
    type: DataTypes.JSON,
    defaultValue: {},
    validate: {
      isValidRanEquipmentData(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error('RAN equipment data must be a single object');
        }
        // Validate fields
        if (value.existing_location !== undefined && typeof value.existing_location !== 'string') {
          throw new Error('existing_location must be a string');
        }
        if (value.existing_vendor !== undefined && typeof value.existing_vendor !== 'string') {
          throw new Error('existing_vendor must be a string');
        }
        if (value.existing_type_model && !Array.isArray(value.existing_type_model)) {
          throw new Error('existing_type_model must be an array');
        }
        if (value.new_installation_location && !Array.isArray(value.new_installation_location)) {
          throw new Error('new_installation_location must be an array');
        }
        if (value.length_of_transmission_cable !== undefined && value.length_of_transmission_cable !== null && value.length_of_transmission_cable !== '') {
          const num = parseFloat(value.length_of_transmission_cable);
          if (isNaN(num) || num < 0) {
            throw new Error('length_of_transmission_cable must be a positive number');
          }
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
  tableName: 'ran_equipment',
  timestamps: false, // We're handling timestamps manually
});

// Add hooks for automatic timestamp management
RanEquipment.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = RanEquipment; 