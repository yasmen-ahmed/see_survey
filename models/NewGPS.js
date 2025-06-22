const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewGPS = sequelize.define('NewGPS', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // GPS antenna configuration
  gps_antenna_location: {
    type: DataTypes.ENUM('On tower', 'On building'),
    allowNull: true
  },
  
  gps_antenna_height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'GPS antenna height from tower base level in meters'
  },
  
  gps_cable_length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Cable length from new GPS antenna location to base band in meters'
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
  tableName: 'new_gps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['session_id'],
      name: 'unique_session_gps_idx'
    }
  ]
});

module.exports = NewGPS; 