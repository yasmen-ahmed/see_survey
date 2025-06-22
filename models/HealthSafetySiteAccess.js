const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthSafetySiteAccess = sequelize.define('HealthSafetySiteAccess', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  // Health & Safety site access fields
  access_road_safe_condition: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Access road in safe condition for all seasons'
  },

  site_access_safe_secure: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Site access safe & secure from unauthorized person'
  },

  safe_usage_access_ensured: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Safe usage of access (ascent, elevator, stairs, ladder) ensured'
  },

  site_safe_environmental_influence: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Site safe from damages by environmental influence'
  },

  permanent_fence_correctly_installed: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Permanent fence correctly installed around the site'
  },

  access_egress_equipment_safe: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Access and egress to and from the site equipment (tower, shelter etc) are safe and free from hazards'
  },

  designated_walkway_routes_tripping: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Designated walkway routes free of tripping and slipping hazards'
  },

  designated_walkway_routes_radiation: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Designated walkway routes protected from radiation hazards (antenna, microwave)'
  },

  emergency_exits_clearly_visible: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Emergency exits are clearly visible and free of obstacles'
  },

  vehicles_good_condition_nsn_rules: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Vehicles used to access the site in good condition and can follow the NSN safe driving rules'
  },

  rubbish_unused_material_removed: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'All rubbish and unused material has been removed/Site clean'
  },

  safe_manual_handling_practices: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Are safe manual handling practices in place'
  },

  ladder_length_adequate: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'All ladder length long enough above exit place or other support aid\'s existing'
  },

  special_permits_required: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'special permits (road blocking permits, crane placement permit etc.)'
  },

  ladders_good_condition: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Are all ladders used for access in a good condition and free from obvious damage or defects'
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'health_safety_site_access',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['session_id'],
      name: 'health_safety_site_access_session_id_idx'
    }
  ]
});

module.exports = HealthSafetySiteAccess; 