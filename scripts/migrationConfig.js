/**
 * Migration Configuration
 * 
 * This file contains configuration settings for migrating data between servers
 */

module.exports = {
  // Source server (current server)
  source: {
    server: 'http://localhost:3000',
    apiPath: '/api/hierarchical-data',
    description: 'Current/Development Server'
  },
  
  // Target server (new server)
  target: {
    server: 'http://10.129.10.227:3000',
    apiPath: '/api/hierarchical-data',
    description: 'New/Production Server'
  },
  
  // Migration options
  options: {
    // Whether to skip existing records (true = skip, false = try to create anyway)
    skipExisting: true,
    
    // Whether to verify data after migration
    verifyAfterMigration: true,
    
    // Timeout for API requests (in milliseconds)
    timeout: 30000,
    
    // Retry attempts for failed requests
    maxRetries: 3,
    
    // Delay between retries (in milliseconds)
    retryDelay: 1000
  },
  
  // Database configuration for direct database access (if needed)
  database: {
    // Source database config (if reading directly from database)
    source: {
      host: 'localhost',
      port: 3306,
      database: 'see_survey_db',
      username: 'root',
      password: ''
    },
    
    // Target database config (if writing directly to database)
    target: {
      host: '10.129.10.227',
      port: 3000,
      database: 'backend_db',
      username: 'remote_admin',
      password: 'StrongPassword123!'
    }
  }
}; 