const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AntennaImages = sequelize.define('AntennaImages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Links to antenna_configuration.session_id'
  },
  antenna_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the antenna in antennas array'
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
    comment: 'Category of photo, e.g. antenna_1_front, antenna_1_back'
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
  metadata: {
    type: DataTypes.JSON,
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
  tableName: 'antenna_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_antenna_img_session',
      fields: ['session_id']
    },
    {
      name: 'idx_antenna_img_composite',
      fields: ['session_id', 'antenna_number', 'image_category']
    },
    {
      name: 'idx_antenna_img_stored',
      fields: ['stored_filename'],
      unique: true
    }
  ]
});

module.exports = AntennaImages; 