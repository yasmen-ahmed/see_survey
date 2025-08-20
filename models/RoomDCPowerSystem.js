const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomDCPowerSystem = sequelize.define('RoomDCPowerSystem', {
  session_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  number_of_cabinets: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
   
  },
  room_dc_power_data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    
  }
}, {
  tableName: 'room_dc_power_system',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['session_id']
    }
  ]
});

module.exports = RoomDCPowerSystem; 