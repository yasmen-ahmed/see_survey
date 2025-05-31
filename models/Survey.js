const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Survey = sequelize.define('Survey', {
  site_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'site_location',
      key: 'site_id'
    }
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  creator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    primaryKey: true
  },
  country: {
    type: DataTypes.STRING(255)
  },
  ct: {
    type: DataTypes.STRING(255)
  },
  project: {
    type: DataTypes.STRING(255)
  },
  company: {
    type: DataTypes.STRING(255)
  },
  TSSR_Status: {
    type: DataTypes.ENUM('created', 'submitted', 'review', 'done'),
    allowNull: false,
    defaultValue: 'created'
  }
}, {
  tableName: 'survey',
  timestamps: false
});

module.exports = Survey; 