const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewMW = sequelize.define('NewMW', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  session_id: { type: DataTypes.STRING, allowNull: false },
  mw_index: { type: DataTypes.INTEGER, allowNull: false },
  fields: { type: DataTypes.JSON, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'new_mw',
  timestamps: false
});

module.exports = NewMW;