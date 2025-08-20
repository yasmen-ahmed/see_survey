require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create a direct database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'backend_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '1234',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: false
    }
  }
);

async function updateCodeColumns() {
  try {
    console.log('🔧 Updating database column sizes...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');
    
    // Update MU table code column
    console.log('📋 Updating MU table code column...');
    await sequelize.query('ALTER TABLE mus MODIFY COLUMN code VARCHAR(10) NOT NULL');
    console.log('✅ MU table code column updated to VARCHAR(10)\n');
    
    // Update Country table code column
    console.log('📋 Updating Country table code column...');
    await sequelize.query('ALTER TABLE countries MODIFY COLUMN code VARCHAR(10) NOT NULL');
    console.log('✅ Country table code column updated to VARCHAR(10)\n');
    
    // Update CT table code column (if it exists)
    try {
      console.log('📋 Updating CT table code column...');
      await sequelize.query('ALTER TABLE cts MODIFY COLUMN code VARCHAR(20) NOT NULL');
      console.log('✅ CT table code column updated to VARCHAR(20)\n');
    } catch (error) {
      console.log('ℹ️  CT table might not exist yet, skipping...\n');
    }
    
    // Update Project table code column (if it exists)
    try {
      console.log('📋 Updating Project table code column...');
      await sequelize.query('ALTER TABLE projects MODIFY COLUMN code VARCHAR(20) NOT NULL');
      console.log('✅ Project table code column updated to VARCHAR(20)\n');
    } catch (error) {
      console.log('ℹ️  Project table might not exist yet, skipping...\n');
    }
    
    // Update Company table code column (if it exists)
    try {
      console.log('📋 Updating Company table code column...');
      await sequelize.query('ALTER TABLE companies MODIFY COLUMN code VARCHAR(20) NOT NULL');
      console.log('✅ Company table code column updated to VARCHAR(20)\n');
    } catch (error) {
      console.log('ℹ️  Company table might not exist yet, skipping...\n');
    }
    
    console.log('🎉 Database column updates completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database columns:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the update
updateCodeColumns(); 