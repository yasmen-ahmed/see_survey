const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExternalDCDistributionImages = sequelize.define('ExternalDCDistributionImages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Links to external_dc_distribution.session_id'
  },
  record_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of the PDU in dc_pdus array'
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
    comment: 'Category of photo, e.g. pdu_1_photo, pdu_1_fuses'
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
  tableName: 'external_dc_distribution_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_ext_dc_dist_img_session',
      fields: ['session_id']
    },
    {
      name: 'idx_ext_dc_dist_img_composite',
      fields: ['session_id', 'record_id', 'image_category']
    },
    {
      name: 'idx_ext_dc_dist_img_stored',
      fields: ['stored_filename'],
      unique: true
    }
  ]
});

module.exports = ExternalDCDistributionImages; 