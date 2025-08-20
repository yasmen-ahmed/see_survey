const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

async function runRanRoomMigration() {
  try {
    console.log('Starting RAN Room migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../db/migrations/create-ran-room-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await sequelize.query(statement);
      }
    }
    
    console.log('RAN Room migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runRanRoomMigration(); 