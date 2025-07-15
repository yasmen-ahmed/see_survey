const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MU = sequelize.define('MU', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'mus',
  timestamps: true
});

// Define associations
MU.associate = (models) => {
  MU.hasMany(models.Country, { foreignKey: 'mu_id', as: 'countries' });
};

module.exports = MU; 