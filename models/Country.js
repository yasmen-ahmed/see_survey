const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Country Model
 * Represents a country that belongs to a Market Unit (MU)
 * Each country can have multiple CTs (Cities/Territories)
 */
const Country = sequelize.define('Country', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  mu_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'mus',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 10] // Country codes can be 2-10 characters
    }
  }
}, {
  tableName: 'countries',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['mu_id']
    }
  ]
});

// Define associations
Country.associate = (models) => {
  Country.belongsTo(models.MU, { foreignKey: 'mu_id', as: 'mu' });
  Country.hasMany(models.CT, { foreignKey: 'country_id', as: 'cts' });
};

module.exports = Country; 