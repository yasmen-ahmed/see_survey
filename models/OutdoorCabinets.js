const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutdoorCabinets = sequelize.define('OutdoorCabinets', {
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
  
  // Number of cabinets on site
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
  
  // Cabinet data as JSON array
  cabinets: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidCabinetData(value) {
        if (!Array.isArray(value)) {
          throw new Error('Cabinets data must be an array');
        }
        
        // Validate each cabinet
        value.forEach((cabinet, index) => {
          if (typeof cabinet !== 'object' || cabinet === null) {
            throw new Error(`Cabinet ${index + 1} must be an object`);
          }
          
          // Validate cabinet type array
          if (cabinet.type && !Array.isArray(cabinet.type)) {
            throw new Error(`Cabinet ${index + 1} type must be an array`);
          }
          
          // Validate hardware array
          if (cabinet.hardware && !Array.isArray(cabinet.hardware)) {
            throw new Error(`Cabinet ${index + 1} hardware must be an array`);
          }
          
          // Validate numeric fields
          const numericFields = ['coolingCapacity', 'powerCableLength', 'powerCableCrossSection', 'freeU'];
          numericFields.forEach(field => {
            if (cabinet[field] !== undefined && cabinet[field] !== null && cabinet[field] !== '') {
              const value = parseFloat(cabinet[field]);
              if (isNaN(value) || value < 0) {
                throw new Error(`Cabinet ${index + 1} ${field} must be a positive number`);
              }
            }
          });
          
          // Validate CB ratings arrays
          const cbRatingFields = ['blvdCBsRatings', 'llvdCBsRatings', 'pduCBsRatings'];
          cbRatingFields.forEach(field => {
            if (cabinet[field] && Array.isArray(cabinet[field])) {
              cabinet[field].forEach((cbEntry, cbIndex) => {
                if (typeof cbEntry !== 'object' || cbEntry === null) {
                  throw new Error(`Cabinet ${index + 1} ${field} entry ${cbIndex + 1} must be an object`);
                }
                
                // Validate rating if provided
                if (cbEntry.rating !== undefined && cbEntry.rating !== null && cbEntry.rating !== '') {
                  const rating = parseFloat(cbEntry.rating);
                  if (isNaN(rating) || rating < 0) {
                    throw new Error(`Cabinet ${index + 1} ${field} entry ${cbIndex + 1} rating must be a positive number`);
                  }
                }
                
                // Validate connected_load if provided
                if (cbEntry.connected_load !== undefined && typeof cbEntry.connected_load !== 'string') {
                  throw new Error(`Cabinet ${index + 1} ${field} entry ${cbIndex + 1} connected_load must be a string`);
                }
              });
            }
          });
        });
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
  tableName: 'outdoor_cabinets',
  timestamps: false, // We're handling timestamps manually
  indexes: [
    {
      unique: true,
      fields: ['session_id']
    }
  ]
});

// Add hooks for automatic timestamp management
OutdoorCabinets.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = OutdoorCabinets; 