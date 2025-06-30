const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcConnectionImages = sequelize.define('ac_connection_images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  table_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_category: {
    type: DataTypes.STRING,
    allowNull: false
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
  }
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['table_id']
    },
    {
      fields: ['stored_filename'],
      unique: true
    }
  ]
});

module.exports = AcConnectionImages; 