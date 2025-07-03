const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewFPFHsImages = sequelize.define('new_fpfhs_images', {
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
  tableName: 'new_fpfhs_images'
});

module.exports = NewFPFHsImages; 