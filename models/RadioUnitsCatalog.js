const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RadioUnitsCatalog = sequelize.define('RadioUnitsCatalog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  item_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique item code identifier'
  },
  
  item_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Short name/code for the item'
  },
  
  item_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description including product line, configuration, band info, and power rating'
  },
  
  max_of_full: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Maximum power consumption in full operational state'
  },
  
  max_of_busy: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Maximum power consumption in busy operational state'
  },
  
  power_connector_type: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Type of power connector required'
  },
  
  hardware_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'RRH',
    comment: 'Hardware type (usually RRH)'
  },
  
  antenna_connector_interface_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Number of antenna connector interfaces'
  },
  
  antenna_connector_interface_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of antenna connector interface (e.g., N type, 4.3-10)'
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
  tableName: 'radio_units_catalog',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['item_code'],
      name: 'idx_item_code'
    },
    {
      fields: ['item_name'],
      name: 'idx_item_name'
    },
    {
      fields: ['hardware_type'],
      name: 'idx_hardware_type'
    }
  ]
});

module.exports = RadioUnitsCatalog; 