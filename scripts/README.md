# Database Synchronization Scripts

This directory contains scripts to manage and synchronize the hierarchical data (MU, Countries, CTs, Projects, Companies) in the database.

## Files Overview

### 1. `masterDataDefinition.js`
Contains all the master data definitions including:
- **MUs (Management Units)**: CEWA, ME, NWA, Saudi, SAV
- **Countries**: All countries with their MU relationships (many-to-many)
- **CTs (Contract Types)**: All contract types with country and MU relationships
- **Projects**: All projects with their CT relationships
- **Companies**: All companies with their project relationships

### 2. `databaseSynchronization.js`
The main synchronization class that:
- Creates/updates all entities in the database
- Handles many-to-many relationships between MU and Countries
- Maintains referential integrity
- Provides status checking functionality

### 3. `runSync.js`
A simple script to run the complete synchronization process.

## Usage

### Quick Start
```bash
# Navigate to the scripts directory
cd see_survey_backend/scripts

# Run the complete synchronization
node runSync.js
```

### Individual Functions
```bash
# Check database status only
node databaseSynchronization.js --check

# Run synchronization only
node databaseSynchronization.js
```

### Programmatic Usage
```javascript
const DatabaseSynchronization = require('./databaseSynchronization');

// Check current status
await DatabaseSynchronization.checkDatabaseStatus();

// Run synchronization
await DatabaseSynchronization.synchronizeDatabase();
```

## Data Structure

### Many-to-Many Relationships
The system supports countries that belong to multiple MUs:

- **Ethiopia**: CEWA, Saudi, SAV
- **Kenya**: CEWA, Saudi, SAV  
- **Egypt**: NWA, SAV
- **Congo**: Saudi, SAV
- **South Africa**: Saudi, SAV
- **Tanzania**: Saudi, SAV
- **Qatar**: ME, SAV
- **Other countries**: ME, SAV

### Hierarchical Structure
```
MU → Country (many-to-many) → CT → Project → Company
```

## Database Tables

### Core Tables
- `mus` - Management Units
- `countries` - Countries
- `cts` - Contract Types
- `projects` - Projects
- `companies` - Companies

### Junction Table
- `mu_countries` - Many-to-many relationship between MU and Countries

## API Endpoints

After synchronization, the following API endpoints will work:

### Hierarchical Data Routes
- `GET /api/hierarchical-data/mus` - Get all MUs
- `GET /api/hierarchical-data/countries/:muId` - Get countries for a specific MU
- `GET /api/hierarchical-data/cts/:countryId` - Get CTs for a specific country
- `GET /api/hierarchical-data/projects/:ctId` - Get projects for a specific CT
- `GET /api/hierarchical-data/companies/:projectId` - Get companies for a specific project

### Admin Routes
- `GET /api/hierarchical-data/countries` - Get all countries
- `GET /api/hierarchical-data/cts` - Get all CTs
- `GET /api/hierarchical-data/projects` - Get all projects
- `GET /api/hierarchical-data/companies` - Get all companies
- `GET /api/hierarchical-data/hierarchy/:muId` - Get complete hierarchy for a MU

## Frontend Integration

The frontend can now properly filter data:

1. **Select MU** → Shows only countries belonging to that MU
2. **Select Country** → Shows only CTs for that country (filtered by MU)
3. **Select CT** → Shows only projects for that CT
4. **Select Project** → Shows only companies for that project
5. **Select Project** → Shows only users assigned to that project

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `.env` file has correct database credentials
   - Ensure the database server is running

2. **Foreign Key Constraint Errors**
   - The script handles this automatically by creating entities in the correct order
   - If you get errors, try running the script again

3. **Duplicate Entry Errors**
   - The script uses "find or create" logic, so duplicates should not occur
   - If you get duplicate errors, check your database constraints

### Logs
The script provides detailed logging:
- ✅ Success messages
- ℹ️ Information messages (already exists)
- ❌ Error messages
- 📊 Summary reports

## Data Validation

The script includes validation to ensure:
- All required relationships exist
- No orphaned records are created
- Data integrity is maintained
- Proper error handling for missing dependencies

## Adding New Data

To add new data:

1. **Edit `masterDataDefinition.js`**
2. **Add your new data** to the appropriate arrays
3. **Run the synchronization script**
4. **Test the API endpoints**

The script will automatically:
- Create new records
- Maintain relationships
- Skip existing records
- Report any issues 