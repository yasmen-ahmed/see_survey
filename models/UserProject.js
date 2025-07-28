const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProject = sequelize.define('UserProject', {
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
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  assigned_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  role_in_project: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'User\'s role within this specific project'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Project-specific permissions for this user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'user_projects',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'project_id'],
      name: 'unique_user_project'
    }
  ]
});

module.exports = UserProject; 