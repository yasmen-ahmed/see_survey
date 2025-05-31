const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteVisitInfo = sequelize.define('SiteVisitInfo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  survey_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  surveyor_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  subcontractor_company: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  surveyor_phone: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  nokia_representative_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  nokia_representative_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  customer_representative_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  customer_representative_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  }
}, {
  tableName: 'site_visit_info',
  timestamps: false
});

module.exports = SiteVisitInfo; 