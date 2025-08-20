# Hierarchical Data Setup Guide

This guide explains how to set up and use the hierarchical data system for MU → Country → CT → Project → Company relationships.

## Database Structure

The system uses 5 interconnected tables:

1. **MU (Market Unit)** - Top level (e.g., CEWA, ME, NWA)
2. **Country** - Belongs to MU (e.g., Angola, Kenya, Qatar)
3. **CT (City/Territory)** - Belongs to Country (e.g., Angola Territory, Kenya Territory)
4. **Project** - Belongs to CT (e.g., MEA CEWA GROWTH CT Africell Angola)
5. **Company** - Belongs to Project (e.g., Africell Angola)

## API Endpoints

The system provides these API endpoints for filtering:

- `GET /api/hierarchical-data/mus` - Get all MUs
- `GET /api/hierarchical-data/countries/:muId` - Get countries by MU
- `GET /api/hierarchical-data/cts/:countryId` - Get CTs by country
- `GET /api/hierarchical-data/projects/:ctId` - Get projects by CT
- `GET /api/hierarchical-data/companies/:projectId` - Get companies by project

## Setting Up Data

### Option 1: Using the Sample Data Script

1. Run the sample data script:
```bash
cd see_survey_backend
node scripts/seedHierarchicalData.js
```

This will create sample data based on the structure shown in your image.

### Option 2: Using Excel Import (Recommended)

1. Install the xlsx package:
```bash
cd see_survey_backend
npm install xlsx
```

2. Create a sample Excel file:
```bash
node scripts/importFromExcel.js --create-sample
```

3. Edit the generated `scripts/sample_hierarchical_data.xlsx` file with your actual data.

4. Import your data:
```bash
node scripts/importFromExcel.js scripts/sample_hierarchical_data.xlsx
```

### Excel File Format

Your Excel file should have this structure:

| MU   | Country | CT              | Project                    | Company        |
|------|---------|-----------------|----------------------------|----------------|
| CEWA | Angola  | Angola Territory| MEA CEWA GROWTH CT...     | Africell Angola|
| CEWA | Kenya   | Kenya Territory | MEA CEWA AIR CT...        | Airtel Kenya   |
| ME   | Qatar   | Qatar Territory | MEA ENT ME GEL CT...      | Qatar Telecom  |

**Important Notes:**
- First row should be headers
- All 5 columns are required
- The system will automatically create unique codes
- Duplicate entries will be handled (only one instance of each entity will be created)

## Frontend Integration

The Createform component has been updated to use this hierarchical system:

1. **MU Selection** - Loads all MUs
2. **Country Selection** - Filters countries based on selected MU
3. **CT Selection** - Filters CTs based on selected country
4. **Project Selection** - Filters projects based on selected CT
5. **Company Selection** - Filters companies based on selected project

## Data Entry Best Practices

### For Excel Import:

1. **Consistent Naming**: Use consistent names across your organization
2. **Unique Identifiers**: Each project should have a unique name
3. **Hierarchy Validation**: Ensure your data follows the hierarchy correctly
4. **Backup**: Always backup your data before running import scripts

### Example Data Structure:

Based on your image, here's how to structure your Excel:

```
MU,Country,CT,Project,Company
CEWA,Angola,Angola Territory,MEA CEWA GROWTH CT Africell Angola,Africell Angola
CEWA,Kenya,Kenya Territory,MEA CEWA AIR CT Airtel Kenya,Airtel Kenya
ME,Qatar,Qatar Territory,MEA ENT ME GEL CT Qatar Kuwait & Iran,Qatar Telecom
ME,Kuwait,Kuwait Territory,MEA ENT ME GEL CT Qatar Kuwait & Iran,Kuwait Telecom
ME,Iraq,Iraq Territory,MEA ME IRQ CT Asiacell Iraq,Asiacell Iraq
ME,Jordan,Jordan Territory,MEA ME LEV CT Zain JO,Zain Jordan
NWA,Algeria,Algeria Territory,MEA NWA NA CT Ooredoo Algeria,Ooredoo Algeria
NWA,Cameroon,Cameroon Territory,MEA NWA OCWA CT Orange Cameroon & CEA Others,Orange Cameroon
NWA,Egypt,Egypt Territory,MEA NWA ES CT Etisalat Egypt,Etisalat Egypt
```

## Troubleshooting

### Common Issues:

1. **"xlsx package not found"**
   - Run: `npm install xlsx`

2. **"Table doesn't exist"**
   - Ensure your database is synced: `npm start` (this will create tables)

3. **"Foreign key constraint failed"**
   - Clear existing data first or check your hierarchy relationships

4. **Frontend not loading data**
   - Check browser console for API errors
   - Verify your backend is running
   - Check CORS settings

### Debugging:

1. **Check API endpoints**:
   ```bash
   curl http://localhost:3000/api/hierarchical-data/mus
   ```

2. **Check database directly**:
   ```sql
   SELECT * FROM mus;
   SELECT * FROM countries;
   SELECT * FROM cts;
   SELECT * FROM projects;
   SELECT * FROM companies;
   ```

3. **View relationships**:
   ```sql
   SELECT m.name as mu, c.name as country, ct.name as ct, p.name as project, comp.name as company
   FROM mus m
   JOIN countries c ON c.mu_id = m.id
   JOIN cts ct ON ct.country_id = c.id
   JOIN projects p ON p.ct_id = ct.id
   JOIN companies comp ON comp.project_id = p.id
   ORDER BY m.name, c.name, ct.name, p.name, comp.name;
   ```

## Updating Data

To update existing data:

1. **Add new entries**: Just add new rows to your Excel file and re-import
2. **Modify existing entries**: Update the Excel file and re-import (this will clear and recreate all data)
3. **Delete entries**: Remove rows from Excel file and re-import

**Note**: The current import script clears all existing data. If you need to preserve existing data, modify the script to handle updates instead of full replacement.

## Security Considerations

- The hierarchical data endpoints are public (no authentication required)
- Consider adding authentication if this data is sensitive
- Validate input data before importing
- Backup your database before running import scripts

## Performance Notes

- The system uses proper database indexes for efficient filtering
- Large datasets (>10,000 rows) may require optimization
- Consider pagination for very large result sets
- The frontend caches data to reduce API calls 