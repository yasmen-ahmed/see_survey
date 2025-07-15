const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CT = sequelize.define('CT', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'countries',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false
  }
}, {
  tableName: 'cts',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['country_id', 'code']
    }
  ]
});

// Define associations
CT.associate = (models) => {
  CT.belongsTo(models.Country, { foreignKey: 'country_id', as: 'country' });
  CT.hasMany(models.Project, { foreignKey: 'ct_id', as: 'projects' });
};

module.exports = CT; 