const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteAreaInfo = sequelize.define('SiteAreaInfo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: { model: 'survey', key: 'session_id' }
  },
  site_located_at: { type: DataTypes.STRING, defaultValue: '' }, // radio
  site_ownership: { type: DataTypes.STRING, defaultValue: '' }, // radio
  shared_site: { type: DataTypes.STRING, defaultValue: '' }, // radio
  other_telecom_operator_exist_onsite: { type: DataTypes.STRING, defaultValue: '' }, // checkbox (array as string)
  ac_power_sharing: { type: DataTypes.STRING, defaultValue: '' }, // radio
  dc_power_sharing: { type: DataTypes.STRING, defaultValue: '' }, // radio
  site_topology: { type: DataTypes.STRING, defaultValue: '' }, // radio
  site_type: { type: DataTypes.STRING, defaultValue: '' }, // radio
  planned_scope: { type: DataTypes.STRING, defaultValue: '' }, // checkbox (array as string)
  location_of_existing_telecom_racks_cabinets: { type: DataTypes.STRING, defaultValue: '' }, // checkbox (array as string)
  location_of_planned_new_telecom_racks_cabinets: { type: DataTypes.STRING, defaultValue: '' }, // checkbox (array as string)
  existing_technology: { type: DataTypes.STRING, defaultValue: '' } // checkbox (array as string)
}, {
  tableName: 'site_area_info',
  timestamps: false
});

module.exports = SiteAreaInfo;
