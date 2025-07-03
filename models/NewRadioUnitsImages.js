const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewRadioUnitsImages = sequelize.define('new_radio_units_images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  radio_unit_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image_path: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'new_radio_units_images'
});

module.exports = NewRadioUnitsImages; 