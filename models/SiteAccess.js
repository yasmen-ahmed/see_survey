const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteAccess = sequelize.define('SiteAccess', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: { model: 'survey', key: 'session_id' }
  },
  site_access_permission_required: { type: DataTypes.STRING, defaultValue: '' },
  contact_person_name: { type: DataTypes.STRING, defaultValue: '' },
  contact_tel_number: { type: DataTypes.STRING, defaultValue: '' },
  available_access_time: { type: DataTypes.STRING, defaultValue: '' },
  type_of_gated_fence: { type: DataTypes.STRING, defaultValue: '' },
  keys_type: { type: DataTypes.STRING, defaultValue: '' },
  stair_lift_height: { type: DataTypes.FLOAT, defaultValue: 0 },
  stair_lift_width: { type: DataTypes.FLOAT, defaultValue: 0 },
  stair_lift_depth: { type: DataTypes.FLOAT, defaultValue: 0 },
  preferred_time_slot_crane_access: { type: DataTypes.STRING, defaultValue: '' },
  access_to_site_by_road: { type: DataTypes.STRING, defaultValue: '' },
  keys_required: { type: DataTypes.STRING, defaultValue: '' },
  material_accessibility_to_site: { type: DataTypes.STRING, defaultValue: '' },
  contact_person_name_for_site_key: { type: DataTypes.STRING, defaultValue: '' },
  contact_tel_number_for_site_key: { type: DataTypes.STRING, defaultValue: '' }
}, {
  tableName: 'site_access',
  timestamps: false
});

module.exports = SiteAccess;
