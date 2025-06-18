const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');

async function createRadioUnitsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Drop table if it exists (for clean creation)
    await sequelize.getQueryInterface().dropTable('radio_units', { cascade: true, force: true }).catch(() => {
      console.log('ℹ️  Table radio_units does not exist, creating new...');
    });

    // Create radio_units table without foreign key constraint
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
        defaultValue: '[]',
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
- session_id (VARCHAR, PRIMARY KEY)
- radio_unit_count (INTEGER, 1-20)
- radio_units (JSON array of radio unit objects)
- created_at (DATETIME)
- updated_at (DATETIME)

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
    "dc_power_source": "cabinet_1",
    "dc_cb_fuse": "cabinet_1_blvd_0"
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
      console.error('🗃️  Database error:', error.message);
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