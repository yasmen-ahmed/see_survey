const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomInfoImages = sequelize.define('RoomInfoImages', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  upload_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'room_info_images',
  timestamps: false
});

module.exports = RoomInfoImages; 