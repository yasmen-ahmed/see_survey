const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthSafetyBTSAccess = sequelize.define('HealthSafetyBTSAccess', {
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

  // Health & Safety BTS / Antenna access fields
  safety_climbing_system_correctly_installed: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'safety climbing system correctly installed (fixing elements, connection screws, fall arrestors,) according safety specification'
  },

  walking_path_situated_safety_specifications: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'walking path situated according to safety specifications'
  },

  mw_antennas_height_exclusion_zone: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Where people can walk in front of MW antennas, antennas height from walkway: exclusion zone should be clearly identified'
  },

  non_authorized_access_antennas_prevented: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'non-authorized access to the front of antennas and dishes adequately prevented'
  },

  bts_pole_access_lighting_sufficient: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'BTS/Pole access lighting working and sufficient'
  },

  safe_access_bts_poles_granted: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'safe access to BTS and poles granted'
  },

  pathway_blocks_walking_grids_installed: {
    type: DataTypes.ENUM('Yes', 'No', 'Not applicable'),
    allowNull: true,
    comment: 'Pathway blocks/walking grids correctly installed'
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
  tableName: 'health_safety_bts_access',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['session_id'],
      name: 'health_safety_bts_access_session_id_idx'
    }
  ]
});

module.exports = HealthSafetyBTSAccess; 