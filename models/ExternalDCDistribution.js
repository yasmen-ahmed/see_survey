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
    comment: `Array of DC PDU objects, each containing: 
    - is_shared_panel: Boolean
    - dc_distribution_model: String (Nokia FPFH/Nokia FPFD/DC panel/Other)
    - dc_distribution_location: String (On ground level/On tower)
    - pdu_height_from_base: String/Number (meters)
    - dc_feed_cabinet: String (cabinet reference value like "1-BLVD-0")
    - dc_feed_cabinet_details: Object {cabinet_number, distribution_type, distribution_index, connected_load}
    - dc_feed_distribution_type: String (BI VD/LI VD/PDU)
    - feeding_dc_cbs: String
    - dc_cable_length: String/Number (meters)
    - dc_cable_cross_section: String/Number (mm²)
    - has_free_cbs_fuses: Boolean
    - cb_fuse_ratings: String`
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