const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewAntennasImages = sequelize.define('new_antennas_images', {
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
  tableName: 'new_antennas_images'
});

module.exports = NewAntennasImages; 