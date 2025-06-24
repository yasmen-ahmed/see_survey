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
  },
  
  // FPFH installation details
  fpfh_installation_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  fpfh_location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  fpfh_base_height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  
  fpfh_tower_leg: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // DC power configuration
  fpfh_dc_power_source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  dc_distribution_source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Cable lengths
  ethernet_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  
  dc_power_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  
  // Earth bus bar
  earth_bus_bar_exists: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  earth_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
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