const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AntennaStructureImages = sequelize.define('AntennaStructureImages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
    comment: 'Links to antenna_structure.session_id'
  },
  
  image_category: {
    type: DataTypes.ENUM(
      'structure_general_photo',
      'structure_legs_photo_1',
      'structure_legs_photo_2', 
      'structure_legs_photo_3',
      'structure_legs_photo_4',
      'building_photo',
      'north_direction_view',
      'cables_route_photo_from_tower_top_1',
      'cables_route_photo_from_tower_top_2',
      'general_structure_photo',
      'custom_photo'
    ),
    allowNull: false,
    comment: 'Category/type of the antenna structure image'
  },
  
  original_filename: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Original filename uploaded by user'
  },
  
  stored_filename: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique filename stored on server'
  },
  
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Full file path on server'
  },
  
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'URL to access the image'
  },
  
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'File size in bytes'
  },
  
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'MIME type of the image'
  },
  
  image_width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Image width in pixels'
  },
  
  image_height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Image height in pixels'
  },
  
  upload_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'When the image was uploaded'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description or notes about the image'
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the image is active (for soft delete)'
  },
  
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata like GPS coordinates, camera info, etc.'
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
  tableName: 'antenna_structure_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['session_id'],
      name: 'antenna_structure_images_session_id_idx'
    },
    {
      fields: ['session_id', 'image_category'],
      name: 'antenna_structure_images_session_category_idx'
    },
    {
      fields: ['stored_filename'],
      name: 'antenna_structure_images_filename_idx',
      unique: true
    },
    {
      fields: ['is_active'],
      name: 'antenna_structure_images_active_idx'
    }
  ]
});

module.exports = AntennaStructureImages; 