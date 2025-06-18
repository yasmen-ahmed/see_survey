const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSurveyTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database, checking survey table indexes...');
    
    // Get all indexes from survey table
    const [indexes] = await connection.execute('SHOW INDEX FROM survey');
    console.log(`Total indexes in survey table: ${indexes.length}`);
    
    // Log all index names for debugging
    console.log('All indexes:', indexes.map(i => `${i.Key_name} (${i.Column_name})`));
    
    // Find all session_id related indexes (except PRIMARY)
    const sessionIdIndexes = indexes.filter(idx => 
      idx.Column_name === 'session_id' && 
      idx.Key_name !== 'PRIMARY'
    );
    
    console.log(`Found ${sessionIdIndexes.length} session_id indexes:`, sessionIdIndexes.map(i => i.Key_name));
    
    // Remove all session_id indexes except the first unique one
    let removedCount = 0;
    for (let i = 1; i < sessionIdIndexes.length; i++) {
      try {
        const indexName = sessionIdIndexes[i].Key_name;
        console.log(`Removing index: ${indexName}`);
        await connection.execute(`ALTER TABLE survey DROP INDEX \`${indexName}\``);
        removedCount++;
      } catch (e) {
        console.log(`Could not remove index ${sessionIdIndexes[i].Key_name}: ${e.message}`);
      }
    }
    
    // Also check for any other duplicate indexes
    const allIndexNames = indexes.map(i => i.Key_name);
    const duplicateNames = allIndexNames.filter((name, index) => 
      allIndexNames.indexOf(name) !== index && name !== 'PRIMARY'
    );
    
    console.log(`Found ${duplicateNames.length} duplicate index names:`, [...new Set(duplicateNames)]);
    
    for (const dupName of [...new Set(duplicateNames)]) {
      try {
        console.log(`Removing duplicate index: ${dupName}`);
        await connection.execute(`ALTER TABLE survey DROP INDEX \`${dupName}\``);
        removedCount++;
      } catch (e) {
        console.log(`Could not remove duplicate index ${dupName}: ${e.message}`);
      }
    }
    
    console.log(`✅ Survey table fix completed! Removed ${removedCount} indexes.`);
    
    // Show final index count
    const [finalIndexes] = await connection.execute('SHOW INDEX FROM survey');
    console.log(`Final index count: ${finalIndexes.length}`);
    
  } catch (error) {
    console.error('❌ Error fixing survey table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

fixSurveyTable(); 