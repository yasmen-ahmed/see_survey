const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExternalDCDistribution = sequelize.define('ExternalDCDistribution', {
  session_id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'survey',
      key: 'session_id'
    }
  },
  // Is there separate DC PDU feeding the radio units, baseband & other equipment?
  has_separate_dc_pdu: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true
  },
  // How many?
  pdu_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  // Array of DC PDU data - each PDU has its own set of properties
  dc_pdus: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of DC PDU objects, each containing: is_shared_panel, dc_distribution_model, dc_distribution_location, pdu_height_from_base, dc_feed_cabinet, dc_feed_distribution_type, feeding_dc_cbs, dc_cable_length, dc_cable_cross_section, has_free_cbs_fuses, cb_fuse_ratings'
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
  tableName: 'external_dc_distribution',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = ExternalDCDistribution; 