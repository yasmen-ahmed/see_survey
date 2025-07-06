const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'companies',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'code']
    }
  ]
});

module.exports = Company; 