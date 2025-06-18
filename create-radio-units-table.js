const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');

async function createRadioUnitsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Create radio_units table
    await sequelize.getQueryInterface().createTable('radio_units', {
      session_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      radio_unit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      radio_units: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    });

    console.log('✅ radio_units table created successfully!');

    // Add foreign key constraint
    await sequelize.getQueryInterface().addConstraint('radio_units', {
      fields: ['session_id'],
      type: 'foreign key',
      name: 'fk_radio_units_session_id',
      references: {
        table: 'surveys',
        field: 'session_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    console.log('✅ Foreign key constraint added successfully!');

    // Create indexes for better performance
    await sequelize.getQueryInterface().addIndex('radio_units', ['session_id'], {
      name: 'idx_radio_units_session_id'
    });

    await sequelize.getQueryInterface().addIndex('radio_units', ['radio_unit_count'], {
      name: 'idx_radio_units_count'
    });

    console.log('✅ Indexes created successfully!');

    console.log(`
🎯 Radio Units Table Created Successfully!

📋 Table Structure:
- session_id (VARCHAR, PRIMARY KEY, FK to surveys.session_id)
- radio_unit_count (INTEGER, 1-20)
- radio_units (JSON array of radio unit objects)
- created_at (DATETIME)
- updated_at (DATETIME)

🔗 Foreign Key: session_id -> surveys.session_id (CASCADE)
📊 Indexes: session_id, radio_unit_count

📝 Sample JSON Structure for radio_units:
[
  {
    "operator": "Operator 1",
    "base_height": 20,
    "tower_leg": "A",
    "vendor": "Nokia",
    "nokia_model": "AAOA",
    "nokia_ports": "4",
    "nokia_port_connectivity": [
      {
        "sector": 1,
        "antenna": 1,
        "jumper_length": 15
      }
    ],
    "dc_power_source": "External DC PDU #1",
    "dc_cb_fuse": "external_pdu_1_Fuse_32A"
  }
]

✅ Ready to use with API endpoints:
- GET    /api/radio-units/:session_id
- GET    /api/radio-units/relations/:session_id  
- POST   /api/radio-units/:session_id
- PUT    /api/radio-units/:session_id
- PATCH  /api/radio-units/:session_id/unit/:unit_index
- DELETE /api/radio-units/:session_id
    `);

  } catch (error) {
    console.error('❌ Error creating radio_units table:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('🔌 Database connection failed. Please check your database configuration.');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('🗃️  Database error. The table might already exist or there\'s a constraint issue.');
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed.');
  }
}

// Run the migration
if (require.main === module) {
  createRadioUnitsTable();
}

module.exports = createRadioUnitsTable; 