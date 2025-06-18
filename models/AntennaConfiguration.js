const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AntennaConfiguration = sequelize.define('AntennaConfiguration', {
  session_id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  // How many antenna on site?
  antenna_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 15
    }
  },
  // Array of antenna data - each antenna has its own set of properties
  antennas: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of antenna objects, each containing all antenna configuration fields'
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
  tableName: 'antenna_configuration',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = AntennaConfiguration; 