const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomPreparation = sequelize.define('RoomPreparation', {
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
  ac_type: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ac_count: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ac_capacity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  ac_status: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cable_tray_height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cable_tray_width: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  existing_cable_tray_space: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  available_space_in_feeder_window: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  feeder_free_holes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  feeder_windows: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bus_bar_free_holes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rack_free_positions: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'room_preparation',
  timestamps: false
});

module.exports = RoomPreparation; 