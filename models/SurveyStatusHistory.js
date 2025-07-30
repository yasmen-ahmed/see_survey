const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SurveyStatusHistory = sequelize.define('SurveyStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Username who made the status change'
  },
  current_status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Previous status before change'
  },
  new_status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'New status after change'
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when status was changed'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes about the status change'
  }
}, {
  tableName: 'survey_status_history',
  timestamps: false,
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['username']
    },
    {
      fields: ['changed_at']
    }
  ]
});

module.exports = SurveyStatusHistory; 