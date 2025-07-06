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
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 3] // Country codes are typically 2-3 characters
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

module.exports = Country; 