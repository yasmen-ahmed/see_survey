const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AntennaStructure = sequelize.define('AntennaStructure', {
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
  antenna_structure_data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    validate: {
      isValidAntennaStructureData(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Antenna structure data must be a valid object');
        }
      }
    }
  }
}, {
  tableName: 'antenna_structure',
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

module.exports = AntennaStructure; 