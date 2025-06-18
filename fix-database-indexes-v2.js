const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseIndexes() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Tables that commonly have duplicate session_id indexes
    const tablesToFix = [
      'ran_equipment',
      'outdoor_cabinets', 
      'ac_connection_info',
      'ac_panel',
      'power_meter',
      'outdoor_general_layout',
      'external_dc_distribution',
      'antenna_configuration'
    ];

    let totalIndexesRemoved = 0;

    for (const table of tablesToFix) {
      try {
        console.log(`\n--- Checking table: ${table} ---`);
        
        // Get all indexes for this table
        const [indexes] = await connection.execute(
          `SHOW INDEX FROM ${table} WHERE Column_name = 'session_id'`
        );

        console.log(`Found ${indexes.length} session_id indexes in ${table}`);

        // Find duplicate indexes (keep only the first one)
        const seenIndexes = new Set();
        const duplicateIndexes = [];

        for (const index of indexes) {
          const indexKey = `${index.Key_name}-${index.Column_name}`;
          
          if (seenIndexes.has(indexKey) || (index.Key_name !== 'PRIMARY' && index.Key_name.includes('session_id'))) {
            duplicateIndexes.push(index);
          } else {
            seenIndexes.add(indexKey);
          }
        }

        // Remove duplicate indexes
        for (const dupIndex of duplicateIndexes) {
          try {
            if (dupIndex.Key_name !== 'PRIMARY') {
              const dropQuery = `ALTER TABLE ${table} DROP INDEX \`${dupIndex.Key_name}\``;
              console.log(`Removing index: ${dupIndex.Key_name} from ${table}`);
              await connection.execute(dropQuery);
              totalIndexesRemoved++;
            }
          } catch (dropError) {
            console.log(`Could not remove index ${dupIndex.Key_name}: ${dropError.message}`);
          }
        }

        // Also check for any auto-generated indexes and remove excess ones
        const [allIndexes] = await connection.execute(`SHOW INDEX FROM ${table}`);
        const sessionIdIndexes = allIndexes.filter(idx => 
          idx.Column_name === 'session_id' && 
          idx.Key_name !== 'PRIMARY' && 
          idx.Key_name !== 'session_id' // Keep the main session_id index
        );

        for (let i = 1; i < sessionIdIndexes.length; i++) { // Keep first, remove rest
          try {
            const indexToRemove = sessionIdIndexes[i];
            const dropQuery = `ALTER TABLE ${table} DROP INDEX \`${indexToRemove.Key_name}\``;
            console.log(`Removing excess index: ${indexToRemove.Key_name} from ${table}`);
            await connection.execute(dropQuery);
            totalIndexesRemoved++;
          } catch (dropError) {
            console.log(`Could not remove excess index: ${dropError.message}`);
          }
        }

      } catch (tableError) {
        console.log(`Table ${table} might not exist or has no issues: ${tableError.message}`);
      }
    }

    console.log(`\n✅ Database index cleanup completed!`);
    console.log(`📊 Total duplicate indexes removed: ${totalIndexesRemoved}`);
    console.log(`🚀 You can now start your server with: npm start`);

  } catch (error) {
    console.error('❌ Error fixing database indexes:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the fix
fixDatabaseIndexes(); 