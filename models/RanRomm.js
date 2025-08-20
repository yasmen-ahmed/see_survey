const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RanRoom = sequelize.define(
  'RanRoom',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Foreign key to session
    session_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Session ID cannot be empty',
        },
      },
    },

    // Number of cabinets (synced from outdoor_cabinets table)
    number_of_cabinets: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    // RAN equipment data as a single JSON object containing all frontend fields
    ran_equipment: {
      type: DataTypes.JSON,
      defaultValue: {
        // BTS table fields
        how_many_base_band_onsite: '',
        bts_table: [],

        // RAN equipment fields
        how_many_racks_for_ran_bts: '',
        ran_equipment_vendor: [],
        free_slots_in_ran_racks: '',
        rack_type_with_free_slots: [],
        available_locations_for_nokia_hw: [],
        new_installation_location: [],
        transmission_cable_length: '',

        // Legacy fields (keeping for compatibility)
        existing_location: '',
        existing_vendor: '',
        existing_type_model: [],
        length_of_transmission_cable: '',
      },
    },

    // Metadata for tracking
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'ran_room',
    timestamps: false, // We're handling timestamps manually
  }
);

// Add hooks for automatic timestamp management
RanRoom.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = RanRoom;
