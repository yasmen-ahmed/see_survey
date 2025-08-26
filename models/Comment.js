const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance method to check if comment can be edited (within 1 hour)
Comment.prototype.canBeEdited = function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.created_at > oneHourAgo;
};

// Instance method to check if user can edit this comment
Comment.prototype.canUserEdit = function(userId) {
  return this.user_id === userId && this.canBeEdited();
};

module.exports = Comment;
