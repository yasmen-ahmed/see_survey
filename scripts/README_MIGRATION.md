# Server Migration Guide

This guide explains how to migrate hierarchical data from one server to another using the provided scripts.

## Overview

The migration system consists of several scripts that help you:
1. **Setup** a new server with the required structure
2. **Migrate** all hierarchical data (MUs, Countries, CTs, Projects, Companies)
3. **Verify** that the migration was successful

## Files

- `migrationConfig.js` - Configuration settings for servers
- `setupNewServer.js` - Test and setup new server
- `migrateToNewServer.js` - Main migration script
- `addMissingDataViaAPI.js` - Add missing data to current server
- `smartImportFromExcel.js` - Import data from Excel files

## Prerequisites

### Source Server (Current)
- ✅ Backend server running
- ✅ Database with hierarchical data
- ✅ API endpoints available at `/api/hierarchical-data`

### Target Server (New)
- ✅ Backend server running on `http://10.129.10.227:3000`
- ✅ Database created with same schema
- ✅ API endpoints available at `/api/hierarchical-data`
- ✅ Network connectivity between servers

## Step-by-Step Migration Process

### Step 1: Configure Migration Settings

Edit `migrationConfig.js` to set your server details:

```javascript
module.exports = {
  source: {
    server: 'http://localhost:3000',        // Your current server
    apiPath: '/api/hierarchical-data'
  },
  target: {
    server: 'http://10.129.10.227:3000',   // Your new server
    apiPath: '/api/hierarchical-data'
  }
};
```

### Step 2: Test New Server Setup

```bash
node scripts/setupNewServer.js
```

This will:
- Test connectivity to the new server
- Verify all API endpoints are working
- Check if the database structure is correct

### Step 3: Run Migration

```bash
node scripts/migrateToNewServer.js
```

This will:
- Read all data from source server
- Create the same data structure on target server
- Maintain all relationships and foreign keys
- Provide detailed progress logging
- Show final statistics

## Migration Features

### ✅ Smart Handling
- **Duplicate Detection**: Automatically detects existing records
- **Relationship Mapping**: Maintains all foreign key relationships
- **Error Recovery**: Continues migration even if some records fail
- **Progress Tracking**: Shows detailed progress and statistics

### ✅ Data Integrity
- **Sequential Migration**: MUs → Countries → CTs → Projects → Companies
- **ID Mapping**: Maps old IDs to new IDs to maintain relationships
- **Verification**: Validates data after migration

### ✅ Error Handling
- **Network Timeouts**: Configurable timeout settings
- **Retry Logic**: Automatic retry for failed requests
- **Detailed Logging**: Shows exactly what succeeded/failed

## Example Migration Output

```
Starting migration to new server...
Source: http://localhost:3000
Target: http://10.129.10.227:3000
==================================================

Testing server connectivity...
✓ Source server accessible - Found 4 MUs
✓ Target server accessible - Found 0 MUs

Reading data from source database...
✓ Read 4 MUs from source
✓ Read 29 Countries from source
✓ Read 13 CTs from source
✓ Read 13 Projects from source
✓ Read 13 Companies from source

Starting data migration...
==================================================

1. Migrating MUs...
  ✓ Created MU: CEWA (16 -> 1)
  ✓ Created MU: ME (17 -> 2)
  ✓ Created MU: NWA (18 -> 3)
  ✓ Created MU: SAV (19 -> 4)

2. Migrating Countries...
  ✓ Created Country: Angola (88 -> 1)
  ✓ Created Country: Ethiopia (101 -> 2)
  ...

==================================================
MIGRATION COMPLETED
==================================================

Source Data Read:
MUs: 4
Countries: 29
CTs: 13
Projects: 13
Companies: 13

Target Data Created:
MUs: 4 created, 0 errors
Countries: 29 created, 0 errors
CTs: 13 created, 0 errors
Projects: 13 created, 0 errors
Companies: 13 created, 0 errors
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
✗ Connectivity test failed: connect ECONNREFUSED
```
**Solution**: Ensure the target server is running and accessible

#### 2. API Endpoint Not Found
```
✗ GET /mus endpoint failed: 404
```
**Solution**: Verify the API path is correct in `migrationConfig.js`

#### 3. Database Schema Mismatch
```
✗ Error creating MU: Data too long for column 'code'
```
**Solution**: Ensure both databases have identical schemas

#### 4. Foreign Key Constraint
```
✗ Cannot create Country: MU mapping not found
```
**Solution**: The migration failed to create a parent record. Check the logs for the specific error.

### Debugging Tips

1. **Check Server Logs**: Look at both source and target server logs
2. **Test Individual Endpoints**: Use `setupNewServer.js` to test each endpoint
3. **Verify Database**: Check if data exists in the target database
4. **Network Connectivity**: Ensure both servers can reach each other

## Advanced Configuration

### Custom Timeouts
```javascript
options: {
  timeout: 60000,        // 60 seconds
  maxRetries: 5,         // 5 retry attempts
  retryDelay: 2000       // 2 seconds between retries
}
```

### Skip Verification
```javascript
options: {
  verifyAfterMigration: false  // Skip final verification
}
```

### Direct Database Access
If you prefer direct database access instead of API calls, you can modify the scripts to use Sequelize directly with the database configuration in `migrationConfig.js`.

## Post-Migration Checklist

After successful migration:

1. ✅ **Verify Data Counts**: Ensure all records were migrated
2. ✅ **Test Relationships**: Verify foreign keys are working
3. ✅ **Test API Endpoints**: Ensure all endpoints work on new server
4. ✅ **Update Frontend**: Point frontend to new server URL
5. ✅ **Monitor Performance**: Check if new server performs well
6. ✅ **Backup**: Create backup of migrated data

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the detailed logs from the migration script
3. Verify server configurations and network connectivity
4. Test individual components using the setup script

## Files Summary

| File | Purpose |
|------|---------|
| `migrationConfig.js` | Server and migration settings |
| `setupNewServer.js` | Test and validate new server |
| `migrateToNewServer.js` | Main migration script |
| `addMissingDataViaAPI.js` | Add missing data to current server |
| `smartImportFromExcel.js` | Import from Excel files |
| `README_MIGRATION.md` | This documentation |

---

**Note**: Always backup your data before running any migration scripts! 