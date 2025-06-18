const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcPanel = sequelize.define('AcPanel', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // Ensure one record per session
    references: { 
      model: 'survey', 
      key: 'session_id' 
    },
    onDelete: 'CASCADE', // Clean up when survey is deleted
    onUpdate: 'CASCADE'
  },
  
  // AC panel configuration
  ac_panel_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidAcPanelConfig(value) {
        if (value === null) return;
        
        const { type, commercial_power_phases, capacity, space_available, phases_connected } = value;
        
        // Validate type
        if (!type || !['new_installation', 'existing_upgrade'].includes(type)) {
          throw new Error('AC panel type must be "new_installation" or "existing_upgrade"');
        }
        
        // For commercial power, validate phases
        if (commercial_power_phases && ![1, 3].includes(commercial_power_phases)) {
          throw new Error('Commercial power phases must be 1 or 3');
        }
        
        // Validate capacity if provided
        if (capacity !== undefined && capacity !== null && capacity !== '') {
          const capacityValue = parseFloat(capacity);
          if (isNaN(capacityValue) || capacityValue <= 0) {
            throw new Error('AC panel capacity must be a positive number');
          }
        }
        
        // Validate space available
        if (space_available !== undefined && space_available !== null && space_available !== '') {
          const spaceValue = parseInt(space_available);
          if (isNaN(spaceValue) || spaceValue < 0) {
            throw new Error('Space available must be a non-negative integer');
          }
        }
        
        // Validate phases connected if provided
        if (phases_connected && !Array.isArray(phases_connected)) {
          throw new Error('Phases connected must be an array');
        }
      }
    }
  },
  
  // Additional AC equipment details
  ac_equipment: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidAcEquipment(value) {
        if (!Array.isArray(value)) {
          throw new Error('AC equipment must be an array');
        }
        
        value.forEach((equipment, index) => {
          if (!equipment.type || typeof equipment.type !== 'string') {
            throw new Error(`Equipment ${index + 1} must have a valid type`);
          }
          
          if (equipment.power_consumption !== undefined && equipment.power_consumption !== null && equipment.power_consumption !== '') {
            const power = parseFloat(equipment.power_consumption);
            if (isNaN(power) || power < 0) {
              throw new Error(`Equipment ${index + 1} power consumption must be non-negative`);
            }
          }
        });
      }
    }
  },
  
  // Power cable configuration (from power meter to AC panel)
  power_cable_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidCableConfig(value) {
        if (value === null) return;
        
        if (value.length !== undefined && (isNaN(value.length) || value.length < 0)) {
          throw new Error('Cable length must be a positive number');
        }
        
        if (value.cross_section !== undefined && (isNaN(value.cross_section) || value.cross_section < 0)) {
          throw new Error('Cable cross section must be a positive number');
        }
      }
    }
  },
  
  // AC panel main CB configuration
  main_cb_config: {
    type: DataTypes.JSON,
    defaultValue: null,
    validate: {
      isValidMainCBConfig(value) {
        if (value === null) return;
        
        if (value.rating !== undefined && (isNaN(value.rating) || value.rating < 0)) {
          throw new Error('Main CB rating must be a positive number');
        }
        
        if (value.type !== undefined && !['three_phase', 'single_phase'].includes(value.type)) {
          throw new Error('Main CB type must be either three_phase or single_phase');
        }
      }
    }
  },
  
  // Does the AC panel have free CBs?
  has_free_cbs: {
    type: DataTypes.BOOLEAN,
    defaultValue: null
  },
  
  // Dynamic CB/Fuse table data
  cb_fuse_data: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidCBFuseData(value) {
        if (!Array.isArray(value)) {
          throw new Error('CB/Fuse data must be an array');
        }
        
        value.forEach((item, index) => {
          if (typeof item !== 'object' || item === null) {
            throw new Error(`CB/Fuse item ${index + 1} must be an object`);
          }
          
          if (item.rating !== undefined && item.rating !== null && (isNaN(item.rating) || item.rating < 0)) {
            throw new Error(`CB/Fuse item ${index + 1} rating must be a positive number`);
          }
          
          if (item.connected_module !== undefined && typeof item.connected_module !== 'string') {
            throw new Error(`CB/Fuse item ${index + 1} connected module must be a string`);
          }
        });
      }
    }
  },
  
  // Number of free spaces to add new AC CBs
  free_cb_spaces: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    validate: {
      min: 1,
      max: 5
    }
  },
  
  // Metadata for tracking
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
  
}, {
  tableName: 'ac_panel',
  timestamps: false // We're handling timestamps manually
});

// Add hooks for automatic timestamp management
AcPanel.beforeUpdate((instance) => {
  instance.updated_at = new Date();
});

module.exports = AcPanel; 