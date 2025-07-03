const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewGPSImages = sequelize.define('new_gps_images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image_category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image_path: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'new_gps_images'
});

module.exports = NewGPSImages; 