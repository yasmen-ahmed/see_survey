const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewRadioInstallations = sequelize.define('NewRadioInstallations', {
  session_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  
  // New radio installations section
  new_sectors_planned: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  new_radio_units_planned: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  existing_radio_units_swapped: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  // New antennas section
  new_antennas_planned: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  existing_antennas_swapped: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  // New FPFHs section
  new_fpfh_installed: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
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
  tableName: 'new_radio_installations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = NewRadioInstallations; 