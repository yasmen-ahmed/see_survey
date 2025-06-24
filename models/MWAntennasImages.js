const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MWAntennasImages = sequelize.define('MWAntennasImages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Links to mw_antennas.session_id'
  },
  antenna_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the antenna in mw_antennas array'
  },
  record_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Index for multiple records of same category'
  },
  image_category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Category of photo, e.g. antenna_1_photo'
  },
  original_filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stored_filename: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'mw_antennas_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['session_id'] },
    { fields: ['session_id', 'antenna_number', 'image_category'] },
    { fields: ['stored_filename'], unique: true }
  ]
});

module.exports = MWAntennasImages; 