const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MWAntennas = sequelize.define('MWAntennas', {
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
    validate: {
      min: 1,
      max: 50
    }
  },
  mw_antennas_data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    validate: {
      isValidMWAntennasData(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('MW Antennas data must be a valid object');
        }
      }
    }
  }
}, {
  tableName: 'mw_antennas',
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

module.exports = MWAntennas; 