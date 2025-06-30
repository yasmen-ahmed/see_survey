const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RadioUnitImages = sequelize.define('RadioUnitImages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Links to new_radio_units.session_id'
  },
  radio_unit_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the radio unit in radio_units array'
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
    comment: 'Category of photo, e.g. radio_unit_1_front, radio_unit_1_back'
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
  tableName: 'radio_unit_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_radio_unit_img_session',
      fields: ['session_id']
    },
    {
      name: 'idx_radio_unit_img_composite',
      fields: ['session_id', 'radio_unit_number', 'image_category']
    },
    {
      name: 'idx_radio_unit_img_stored',
      fields: ['stored_filename'],
      unique: true
    }
  ]
});

module.exports = RadioUnitImages; 