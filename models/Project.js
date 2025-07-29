const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  ct_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cts',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Project code'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false,
    validate: {
      isIn: [['active', 'inactive', 'completed', 'on_hold']]
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  client: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'projects',
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
});

// Define associations
Project.associate = (models) => {
  Project.belongsTo(models.CT, { foreignKey: 'ct_id', as: 'ct' });
  Project.hasMany(models.Company, { foreignKey: 'project_id', as: 'companies' });
};

module.exports = Project; 