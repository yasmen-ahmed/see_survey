const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteLocation = sequelize.define('SiteLocation', {
  site_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  sitename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(255)
  },
  city: {
    type: DataTypes.STRING(255)
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 6)
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 6)
  },
  site_elevation: {
    type: DataTypes.FLOAT
  },
  address: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'site_location',
  timestamps: false
});

module.exports = SiteLocation; 