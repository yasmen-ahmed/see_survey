const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ct_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cts',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'projects',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['ct_id', 'code']
    }
  ]
});

// Define associations
Project.associate = (models) => {
  Project.belongsTo(models.CT, { foreignKey: 'ct_id', as: 'ct' });
  Project.hasMany(models.Company, { foreignKey: 'project_id', as: 'companies' });
};

module.exports = Project; 