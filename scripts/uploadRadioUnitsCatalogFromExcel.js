const mysql = require('mysql2/promise');
require('dotenv').config();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Helper function to clean and validate data
const cleanCellValue = (value, fieldType) => {
  // If value is null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    switch (fieldType) {
      case 'string':
        return '';
      case 'number':
        return null; // Use null for numeric fields instead of 0
      case 'integer':
        return null;
      case 'decimal':
        return null;
      default:
        return '';
    }
  }

  // Convert to string and trim
  const stringValue = String(value).trim();
  
  // If trimmed value is empty
  if (stringValue === '') {
    switch (fieldType) {
      case 'string':
        return '';
      case 'number':
      case 'integer':
      case 'decimal':
        return null;
      default:
        return '';
    }
  }

  // Handle different field types
  switch (fieldType) {
    case 'string':
      return stringValue;
    
    case 'number':
    case 'integer':
    case 'decimal':
      // Try to parse as number
      const numValue = parseFloat(stringValue);
      if (isNaN(numValue)) {
        console.warn(`Warning: Could not parse "${stringValue}" as number for field type ${fieldType}`);
        return null;
      }
      return fieldType === 'integer' ? Math.round(numValue) : numValue;
    
    default:
      return stringValue;
  }
};

// Field mapping configuration
const fieldMapping = {
  'item code': { dbField: 'item_code', type: 'string', required: true },
  'item name': { dbField: 'item_name', type: 'string', required: true },
  'item description': { dbField: 'item_description', type: 'string', required: false },
  'max of full': { dbField: 'max_of_full', type: 'decimal', required: false },
  'max of busy': { dbField: 'max_of_busy', type: 'decimal', required: false },
  'power connector type': { dbField: 'power_connector_type', type: 'string', required: false },
  'hardware type': { dbField: 'hardware_type', type: 'string', required: false },
  'antenna connector interface number': { dbField: 'antenna_connector_interface_number', type: 'integer', required: false },
  'antenna connector interface type': { dbField: 'antenna_connector_interface_type', type: 'string', required: false }
};

async function uploadRadioUnitsCatalogFromExcel(filePath) {
  let connection;
  
  try {
    // Create connection
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

    console.log('✅ Connected to database successfully!');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read Excel file
    console.log(`📖 Reading Excel file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📋 Processing sheet: ${sheetName}`);

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use first row as headers
      defval: '', // Default value for empty cells
      raw: false // Convert all values to strings
    });

    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }

    // Extract headers (first row)
    const headers = jsonData[0].map(header => String(header).toLowerCase().trim());
    console.log('📝 Headers found:', headers);

    // Validate required headers
    const requiredHeaders = ['item code', 'item name'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Process data rows (skip header row)
    const dataRows = jsonData.slice(1);
    console.log(`📊 Processing ${dataRows.length} data rows...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const rowNumber = rowIndex + 2; // +2 because we skipped header and arrays are 0-indexed
      
      try {
        // Skip completely empty rows
        if (row.every(cell => !cell || String(cell).trim() === '')) {
          console.log(`⏭️  Skipping empty row ${rowNumber}`);
          skippedCount++;
          continue;
        }

        // Create data object from row
        const rowData = {};
        let hasRequiredData = false;

        headers.forEach((header, colIndex) => {
          const fieldConfig = fieldMapping[header];
          if (fieldConfig) {
            const rawValue = row[colIndex];
            const cleanedValue = cleanCellValue(rawValue, fieldConfig.type);
            
            // Check if we have required data
            if (fieldConfig.required && cleanedValue !== '' && cleanedValue !== null) {
              hasRequiredData = true;
            }
            
            rowData[fieldConfig.dbField] = cleanedValue;
          }
        });

        // Skip rows without required data
        if (!hasRequiredData) {
          console.log(`⏭️  Skipping row ${rowNumber} - missing required data`);
          skippedCount++;
          continue;
        }

        // Validate item_code is not empty
        if (!rowData.item_code || rowData.item_code === '') {
          console.log(`⏭️  Skipping row ${rowNumber} - missing item_code`);
          skippedCount++;
          continue;
        }

        // Check if item already exists
        const existingItem = await connection.execute(
          'SELECT id FROM radio_units_catalog WHERE item_code = ?',
          [rowData.item_code]
        );

        if (existingItem[0].length > 0) {
          // Update existing item
          const updateFields = Object.keys(rowData)
            .filter(key => key !== 'item_code')
            .map(key => `${key} = ?`)
            .join(', ');
          
          const updateValues = Object.keys(rowData)
            .filter(key => key !== 'item_code')
            .map(key => rowData[key]);

          await connection.execute(
            `UPDATE radio_units_catalog SET ${updateFields} WHERE item_code = ?`,
            [...updateValues, rowData.item_code]
          );

          results.push({
            row: rowNumber,
            item_code: rowData.item_code,
            status: 'updated',
            message: 'Item updated successfully'
          });
          successCount++;
        } else {
          // Insert new item
          const insertFields = Object.keys(rowData).join(', ');
          const insertPlaceholders = Object.keys(rowData).map(() => '?').join(', ');
          const insertValues = Object.values(rowData);

          await connection.execute(
            `INSERT INTO radio_units_catalog (${insertFields}) VALUES (${insertPlaceholders})`,
            insertValues
          );

          results.push({
            row: rowNumber,
            item_code: rowData.item_code,
            status: 'created',
            message: 'Item created successfully'
          });
          successCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing row ${rowNumber}:`, error.message);
        results.push({
          row: rowNumber,
          item_code: row[rowNumber - 2] || 'unknown', // Get item_code from row
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    // Summary
    console.log('\n📈 Upload Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  📊 Total processed: ${dataRows.length}`);

    // Show some sample results
    console.log('\n📋 Sample Results:');
    results.slice(0, 5).forEach(result => {
      console.log(`  Row ${result.row}: ${result.item_code} - ${result.status}`);
    });

    if (results.length > 5) {
      console.log(`  ... and ${results.length - 5} more results`);
    }

    // Return results for API usage
    return {
      summary: {
        total: dataRows.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount
      },
      results: results
    };

  } catch (error) {
    console.error('❌ Error uploading radio units catalog:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

// If running directly (not imported)
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('❌ Please provide the Excel file path as an argument');
    console.log('Usage: node uploadRadioUnitsCatalogFromExcel.js <excel-file-path>');
    process.exit(1);
  }

  uploadRadioUnitsCatalogFromExcel(filePath)
    .then(result => {
      console.log('\n🎉 Upload completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Upload failed:', error.message);
      process.exit(1);
    });
}

module.exports = uploadRadioUnitsCatalogFromExcel; 