const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('survey_created', 'status_change', 'assignment', 'rework', 'approval'),
    allowNull: false
  },
  related_survey_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  related_project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: false,
  indexes: [
    {
      name: 'notifications_user_id_idx',
      fields: ['user_id']
    },
    {
      name: 'notifications_is_read_idx',
      fields: ['is_read']
    },
    {
      name: 'notifications_created_at_idx',
      fields: ['created_at']
    },
    {
      name: 'notifications_type_idx',
      fields: ['type']
    }
  ]
});

module.exports = Notification;
