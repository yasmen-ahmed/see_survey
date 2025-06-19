const mysql = require('mysql2/promise');

async function createTablesSimple() {
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

    // Create new_radio_installations table first
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

    // Create new_antennas table without foreign key constraints
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

    // Show table structures
    console.log('\n📋 new_radio_installations table structure:');
    const [radioRows] = await connection.execute('DESCRIBE new_radio_installations');
    console.table(radioRows);

    console.log('\n📋 new_antennas table structure:');
    const [antennaRows] = await connection.execute('DESCRIBE new_antennas');
    console.table(antennaRows);

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
      console.log('🔒 Database connection closed');
    }
  }
}

createTablesSimple(); 