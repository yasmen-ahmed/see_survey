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
    allowNull: false
  },
  gps_antenna_location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['On tower', 'On building']]
    }
  },
  gps_antenna_height: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  gps_cable_length: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'new_gps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = NewGPS; 