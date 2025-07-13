const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewMWImage = sequelize.define('NewMWImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  session_id: { type: DataTypes.STRING, allowNull: false },
  mw_index: { type: DataTypes.INTEGER, allowNull: false },
  image_category: { type: DataTypes.STRING, allowNull: false },
  original_filename: { type: DataTypes.STRING, allowNull: false },
  stored_filename: { type: DataTypes.STRING, allowNull: false },
  file_url: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'new_mw_images',
  timestamps: false
});

module.exports = NewMWImage;