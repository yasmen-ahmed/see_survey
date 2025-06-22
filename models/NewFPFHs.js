const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewFPFHs = sequelize.define('NewFPFHs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  fpfh_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the FPFH (1, 2, 3, etc.)'
  },
  
  fpfh_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Current FPFH number being configured'
  },
  
  // FPFH installation details
  fpfh_installation_type: {
    type: DataTypes.ENUM('Stacked with other Nokia modules', 'Standalone', 'Other'),
    allowNull: true
  },
  
  fpfh_location: {
    type: DataTypes.ENUM('On ground', 'On tower'),
    allowNull: true
  },
  
  fpfh_base_height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'FPFH base height from tower base level in meters'
  },
  
  fpfh_tower_leg: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: true
  },
  
  // DC power configuration
  fpfh_dc_power_source: {
    type: DataTypes.ENUM('from new DC rectifier cabinet', 'from the existing rectifier cabinet', 'Existing external DC PDU #1', 'Existing external DC PDU #2', 'Existing external DC PDU #n'),
    allowNull: true
  },
  
  dc_distribution_source: {
    type: DataTypes.ENUM('BLVD', 'LLVD', 'PDU'),
    allowNull: true,
    comment: 'DC distribution inside the rectifier cabinet'
  },
  
  // Cable lengths
  ethernet_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of Ethernet cable between new FPFH & base band in meters'
  },
  
  dc_power_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of DC power cable from rectifier to new FPFH in meters'
  },
  
  // Earth bus bar
  earth_bus_bar_exists: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  },
  
  earth_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Length of earth cable from proposed FPFH location to earth bus bar in meters'
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
  tableName: 'new_fpfhs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'fpfh_index'],
      name: 'unique_session_fpfh_idx'
    },
    {
      fields: ['session_id'],
      name: 'session_id_idx'
    }
  ]
});

module.exports = NewFPFHs; 