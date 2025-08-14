const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomInfo = sequelize.define('RoomInfo', {
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
  height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  depth: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  hardware: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  sketch_available: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  }
}, {
  tableName: 'room_info',
  timestamps: false
});

module.exports = RoomInfo;