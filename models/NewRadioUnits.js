const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewRadioUnits = sequelize.define('NewRadioUnits', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  radio_unit_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the radio unit (1, 2, 3, etc.)'
  },
  
  radio_unit_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Current radio unit number being configured'
  },
  
  // Radio unit details
  new_radio_unit_sector: {
    type: DataTypes.ENUM('1', '2', '3', '4', '5', '6'),
    allowNull: true
  },
  
  connected_to_antenna: {
    type: DataTypes.ENUM('New', 'Existing'),
    allowNull: true,
    comment: 'Connected to new or existing antenna'
  },
  
  connected_antenna_technology: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of technologies: 2G, 3G, 4G, 5G'
  },
  
  new_radio_unit_model: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nokia model to be provided by SE'
  },
  
  radio_unit_location: {
    type: DataTypes.ENUM('Tower leg A', 'Tower leg B', 'Tower leg C', 'Tower leg D', 'On the ground'),
    allowNull: true
  },
  
  // Feeder specifications
  feeder_length_to_antenna: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Feeder length until the antenna in meters'
  },
  
  tower_leg_section: {
    type: DataTypes.ENUM('Angular', 'Tubular'),
    allowNull: true
  },
  
  angular_l1_dimension: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'L1 x L2 dimensions in mm for angular'
  },
  
  angular_l2_dimension: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'L1 x L2 dimensions in mm for angular'
  },
  
  tubular_cross_section: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Cross section in mm for tubular'
  },
  
  // Side arm configuration
  side_arm_type: {
    type: DataTypes.ENUM('Use existing empty side arm', 'Use existing antenna side arm', 'New side arm need to be supplied'),
    allowNull: true
  },
  
  side_arm_length: {
    type: DataTypes.DECIMAL(10, 2),
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
  
  // DC power configuration
  dc_power_source: {
    type: DataTypes.ENUM('Direct from rectifier distribution', 'New FPFH', 'Existing FPFH', 'Existing DC PDU (not FPFH)'),
    allowNull: true
  },
  
  dc_power_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of DC power cable from new radio unit to DC power source in meters'
  },
  
  fiber_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of fiber cable from new radio unit to base band in meters'
  },
  
  jumper_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of jumper between new radio unit & antenna in meters'
  },
  
  // Earth bus bar
  earth_bus_bar_exists: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  },
  
  earth_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of earth cable from proposed radio unit location to earth bus bar in meters'
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
  tableName: 'new_radio_units',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'radio_unit_index'],
      name: 'unique_session_radio_unit_idx'
    },
    {
      fields: ['session_id'],
      name: 'session_id_idx'
    }
  ]
});

module.exports = NewRadioUnits; 