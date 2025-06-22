const mysql = require('mysql2/promise');

async function createAllNewTables() {
  let connection;
  
  try {
    // Create connection (update these credentials as needed)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update with your MySQL password
      database: 'see_survey_db'
    });

    console.log('🔌 Connected to MySQL database');

    // Create new_radio_installations table first (parent table)
    const createRadioInstallationsSQL = `
      CREATE TABLE IF NOT EXISTS new_radio_installations (
        session_id VARCHAR(255) NOT NULL PRIMARY KEY,
        new_sectors_planned INT DEFAULT 1 NOT NULL,
        new_radio_units_planned INT DEFAULT 1 NOT NULL,
        existing_radio_units_swapped INT DEFAULT 1 NOT NULL,
        new_antennas_planned INT DEFAULT 1 NOT NULL,
        existing_antennas_swapped INT DEFAULT 1 NOT NULL,
        new_fpfh_installed INT DEFAULT 1 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createRadioInstallationsSQL);
    console.log('✅ new_radio_installations table created successfully!');

    // Create new_antennas table
    const createNewAntennasSQL = `
      CREATE TABLE IF NOT EXISTS new_antennas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        antenna_index INT NOT NULL,
        sector_number ENUM('1', '2', '3', '4', '5', '6') NULL,
        new_or_swap ENUM('New', 'Swap') NULL,
        antenna_technology JSON DEFAULT (JSON_ARRAY()),
        azimuth_angle_shift DECIMAL(10,3) NULL,
        base_height_from_tower DECIMAL(10,3) NULL,
        tower_leg_location ENUM('A', 'B', 'C', 'D') NULL,
        tower_leg_section ENUM('Angular', 'Tubular') NULL,
        angular_l1_dimension DECIMAL(10,2) NULL,
        angular_l2_dimension DECIMAL(10,2) NULL,
        tubular_cross_section DECIMAL(10,2) NULL,
        side_arm_type ENUM('Use existing empty side arm', 'Use swapped antenna side arm', 'New side arm need to be supplied') NULL,
        side_arm_length DECIMAL(10,3) NULL,
        side_arm_cross_section DECIMAL(10,2) NULL,
        side_arm_offset DECIMAL(10,2) NULL,
        earth_bus_bar_exists ENUM('Yes', 'No') NULL,
        earth_cable_length DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_session_antenna_idx (session_id, antenna_index),
        KEY session_id_idx (session_id)
      )
    `;

    await connection.execute(createNewAntennasSQL);
    console.log('✅ new_antennas table created successfully!');

    // Create new_radio_units table
    const createNewRadioUnitsSQL = `
      CREATE TABLE IF NOT EXISTS new_radio_units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        radio_unit_number INT NULL,
        new_radio_unit_sector ENUM('1', '2', '3', '4', '5', '6') NULL,
        connected_to_antenna ENUM('New', 'Existing') NULL,
        connected_antenna_technology JSON DEFAULT (JSON_ARRAY()),
        new_radio_unit_model VARCHAR(255) NULL,
        radio_unit_location ENUM('Tower leg A', 'Tower leg B', 'Tower leg C', 'Tower leg D', 'On the ground') NULL,
        feeder_length_to_antenna DECIMAL(10,2) NULL,
        tower_leg_section ENUM('Angular', 'Tubular') NULL,
        angular_l1_dimension DECIMAL(10,2) NULL,
        angular_l2_dimension DECIMAL(10,2) NULL,
        tubular_cross_section DECIMAL(10,2) NULL,
        side_arm_type ENUM('Use existing empty side arm', 'Use existing antenna side arm', 'New side arm need to be supplied') NULL,
        side_arm_length DECIMAL(10,2) NULL,
        side_arm_cross_section DECIMAL(10,2) NULL,
        side_arm_offset DECIMAL(10,2) NULL,
        dc_power_source ENUM('Direct from rectifier distribution', 'New FPFH', 'Existing FPFH', 'Existing DC PDU (not FPFH)') NULL,
        dc_power_cable_length DECIMAL(10,2) NULL,
        fiber_cable_length DECIMAL(10,2) NULL,
        jumper_length DECIMAL(10,2) NULL,
        earth_bus_bar_exists ENUM('Yes', 'No') NULL,
        earth_cable_length DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY session_id_idx (session_id)
      )
    `;

    await connection.execute(createNewRadioUnitsSQL);
    console.log('✅ new_radio_units table created successfully!');

    // Create new_fpfhs table
    const createNewFPFHsSQL = `
      CREATE TABLE IF NOT EXISTS new_fpfhs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        fpfh_number INT NULL,
        fpfh_installation_type ENUM('Stacked with other Nokia modules', 'Standalone', 'Other') NULL,
        fpfh_location ENUM('On ground', 'On tower') NULL,
        fpfh_base_height DECIMAL(10,2) NULL,
        fpfh_tower_leg ENUM('A', 'B', 'C', 'D') NULL,
        fpfh_dc_power_source ENUM('from new DC rectifier cabinet', 'from the existing rectifier cabinet', 'Existing external DC PDU #1', 'Existing external DC PDU #2', 'Existing external DC PDU #n') NULL,
        dc_distribution_source ENUM('BLVD', 'LLVD', 'PDU') NULL,
        ethernet_cable_length DECIMAL(10,2) NULL,
        dc_power_cable_length DECIMAL(10,2) NULL,
        earth_bus_bar_exists ENUM('Yes', 'No') NULL,
        earth_cable_length DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY session_id_idx (session_id)
      )
    `;

    await connection.execute(createNewFPFHsSQL);
    console.log('✅ new_fpfhs table created successfully!');

    // Create new_gps table
    const createNewGPSSQL = `
      CREATE TABLE IF NOT EXISTS new_gps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        gps_antenna_location ENUM('On tower', 'On building') NULL,
        gps_antenna_height DECIMAL(10,2) NULL,
        gps_cable_length DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY session_id_idx (session_id)
      )
    `;

    await connection.execute(createNewGPSSQL);
    console.log('✅ new_gps table created successfully!');

    // Show table structures
    console.log('\n📊 DATABASE SCHEMA OVERVIEW');
    console.log('============================');

    const tables = [
      'new_radio_installations',
      'new_antennas', 
      'new_radio_units',
      'new_fpfhs',
      'new_gps'
    ];

    for (const tableName of tables) {
      console.log(`\n📋 ${tableName} table structure:`);
      const [rows] = await connection.execute(`DESCRIBE ${tableName}`);
      console.table(rows);
    }

    console.log('\n🎯 API ENDPOINTS AVAILABLE:');
    console.log('===========================');
    console.log('📡 New Radio Installations:');
    console.log('   GET    /api/new-radio-installations/:session_id');
    console.log('   PUT    /api/new-radio-installations/:session_id');
    console.log('   PATCH  /api/new-radio-installations/:session_id');
    console.log('   DELETE /api/new-radio-installations/:session_id');
    
    console.log('\n🛡️ New Antennas:');
    console.log('   GET    /api/new-antennas/:session_id');
    console.log('   GET    /api/new-antennas/:session_id/:antenna_index');
    console.log('   POST   /api/new-antennas/:session_id/:antenna_index');
    console.log('   PUT    /api/new-antennas/:session_id (bulk)');
    console.log('   PUT    /api/new-antennas/:session_id/:antenna_index');
    console.log('   PATCH  /api/new-antennas/:session_id/:antenna_index');
    console.log('   DELETE /api/new-antennas/:session_id/:antenna_index');
    console.log('   DELETE /api/new-antennas/:session_id');

    console.log('\n📻 New Radio Units:');
    console.log('   GET    /api/new-radio-units/:session_id');
    console.log('   PUT    /api/new-radio-units/:session_id');
    console.log('   PATCH  /api/new-radio-units/:session_id');
    console.log('   DELETE /api/new-radio-units/:session_id');

    console.log('\n🔌 New FPFHs:');
    console.log('   GET    /api/new-fpfh/:session_id');
    console.log('   PUT    /api/new-fpfh/:session_id');
    console.log('   PATCH  /api/new-fpfh/:session_id');
    console.log('   DELETE /api/new-fpfh/:session_id');

    console.log('\n🛰️ New GPS:');
    console.log('   GET    /api/new-gps/:session_id');
    console.log('   PUT    /api/new-gps/:session_id');
    console.log('   PATCH  /api/new-gps/:session_id');
    console.log('   DELETE /api/new-gps/:session_id');

    console.log('\n🔗 INTEGRATED PLANNING DATA:');
    console.log('============================');
    console.log('✅ New Radio Units API returns "new_radio_units_planned" from new_radio_installations');
    console.log('✅ New FPFHs API returns "new_fpfh_installed" from new_radio_installations');
    console.log('✅ New Antennas API returns "new_antennas_planned" from new_radio_installations');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Database connection failed. Please ensure:');
      console.log('   - MySQL server is running');
      console.log('   - Database credentials are correct');
      console.log('   - Database "see_survey_db" exists');
    } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ Tables already exist - this is normal');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 Database connection closed');
      console.log('🚀 All tables created successfully! You can now start your server.');
    }
  }
}

createAllNewTables(); 