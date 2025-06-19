const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewAntennas = sequelize.define('NewAntennas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  antenna_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the antenna (1, 2, 3, etc.)'
  },
  
  // Basic antenna information
  sector_number: {
    type: DataTypes.ENUM('1', '2', '3', '4', '5', '6'),
    allowNull: true
  },
  
  new_or_swap: {
    type: DataTypes.ENUM('New', 'Swap'),
    allowNull: true
  },
  
  antenna_technology: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of selected technologies: 2G, 3G, 4G, 5G'
  },
  
  // Location and positioning
  azimuth_angle_shift: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: 'Azimuth angle shift from zero north direction (degrees)'
  },
  
  base_height_from_tower: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: 'New antenna base height from tower base level (meters)'
  },
  
  tower_leg_location: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: true
  },
  
  tower_leg_section: {
    type: DataTypes.ENUM('Angular', 'Tubular'),
    allowNull: true
  },
  
  // Angular tower leg dimensions
  angular_l1_dimension: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'L1 dimension in mm for angular tower leg'
  },
  
  angular_l2_dimension: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'L2 dimension in mm for angular tower leg'
  },
  
  // Tubular tower leg dimensions
  tubular_cross_section: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Cross section in mm for tubular tower leg'
  },
  
  // Side arm configuration
  side_arm_type: {
    type: DataTypes.ENUM('Use existing empty side arm', 'Use swapped antenna side arm', 'New side arm need to be supplied'),
    allowNull: true
  },
  
  side_arm_length: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: 'Side arm length in meters'
  },
  
  side_arm_cross_section: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Side arm cross section in mm'
  },
  
  side_arm_offset: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Side arm offset from tower leg profile in cm'
  },
  
  // Earth bus bar configuration
  earth_bus_bar_exists: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  },
  
  earth_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of earth cable from proposed antenna location to earth bus bar'
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'new_antennas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'antenna_index'],
      name: 'unique_session_antenna_idx'
    },
    {
      fields: ['session_id'],
      name: 'session_id_idx'
    }
  ]
});

module.exports = NewAntennas; 