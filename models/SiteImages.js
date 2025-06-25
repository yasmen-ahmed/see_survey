const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteImages = sequelize.define('SiteImages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  image_category: {
    type: DataTypes.ENUM(
      'site_entrance',
      'building_stairs_lift',
      'roof_entrance',
      'base_station_shelter',
      'site_name_shelter',
      'crane_access_street',
      'crane_location',
      'site_environment'
    ),
    allowNull: false,
    comment: 'Category of the site image'
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
  tableName: 'site_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_site_images_session',
      fields: ['session_id']
    },
    {
      name: 'idx_site_images_category',
      fields: ['session_id', 'image_category']
    },
    {
      name: 'idx_site_images_stored',
      fields: ['stored_filename'],
      unique: true
    }
  ]
});

module.exports = SiteImages; 