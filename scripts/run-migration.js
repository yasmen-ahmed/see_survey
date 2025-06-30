const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    console.log('🔌 Connected to MySQL database');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../db/migrations/create-antenna-images.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    // Split into individual statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Antenna images table created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Database connection failed. Please ensure:');
      console.log('   - MySQL server is running');
      console.log('   - Database credentials are correct');
      console.log('   - Database exists');
    } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ Table already exists - this is normal');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

runMigration(); 