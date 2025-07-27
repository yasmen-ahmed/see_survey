const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RadioUnits = sequelize.define('RadioUnits', {
  session_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  
  // 5. Radio units - Main info
  radio_unit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  // Array of radio units
  radio_units: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidRadioUnits(value) {
        if (!Array.isArray(value)) {
          throw new Error('Radio units must be an array');
        }
        
        value.forEach((unit, index) => {
          // Validate Nokia port connectivity details
          if (unit.nokia_port_connectivity && Array.isArray(unit.nokia_port_connectivity)) {
            unit.nokia_port_connectivity.forEach((conn, connIndex) => {
              if (conn.sector && (conn.sector < 1 || conn.sector > 5)) {
                throw new Error(`Radio unit ${index + 1}, connectivity ${connIndex + 1}: Sector must be 1-5`);
              }
              if (conn.antenna && (conn.antenna < 1 || conn.antenna > 15)) {
                throw new Error(`Radio unit ${index + 1}, connectivity ${connIndex + 1}: Antenna must be 1-15`);
              }
              if (conn.jumper_length && (isNaN(conn.jumper_length) || conn.jumper_length < 0)) {
                throw new Error(`Radio unit ${index + 1}, connectivity ${connIndex + 1}: Jumper length must be a positive number`);
              }
            });
          }

          // Validate band array
          if (unit.band && Array.isArray(unit.band)) {
            const validBands = ['700', '900', '1800', '2100', '2300', '2600', '3500'];
            unit.band.forEach(band => {
              if (!validBands.includes(band)) {
                throw new Error(`Radio unit ${index + 1}: Invalid band value: ${band}`);
              }
            });
          }

          // Validate connectedToBaseBand array
          if (unit.connectedToBaseBand && Array.isArray(unit.connectedToBaseBand)) {
            const validBaseBands = ['Base band 1', 'Base band 2', 'Base band 3', 'Base band 4', 'Base band 5', 'Base band 6', 'Base band 7'];
            unit.connectedToBaseBand.forEach(baseBand => {
              if (!validBaseBands.includes(baseBand)) {
                throw new Error(`Radio unit ${index + 1}: Invalid base band value: ${baseBand}`);
              }
            });
          }

          // Validate actionPlanned
          if (unit.actionPlanned && !['Swap', 'Dismantle', 'No action'].includes(unit.actionPlanned)) {
            throw new Error(`Radio unit ${index + 1}: Invalid action planned value: ${unit.actionPlanned}`);
          }

          // Validate technologies array (Radio Module Technology)
          if (unit.technologies && Array.isArray(unit.technologies)) {
            const validTechnologies = ['2G', '3G', '4G', '5G'];
            unit.technologies.forEach(tech => {
              if (!validTechnologies.includes(tech)) {
                throw new Error(`Radio unit ${index + 1}: Invalid technology value: ${tech}`);
              }
            });
          }
        });
      }
    }
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
  tableName: 'radio_units',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RadioUnits; 