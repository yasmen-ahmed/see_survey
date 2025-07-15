const xlsx = require('xlsx');
const sequelize = require('../config/database');
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');
const path = require('path');

/**
 * Smart Excel Import Script for Hierarchical Data
 * 
 * This script intelligently handles existing data:
 * - Checks if entities already exist before creating new ones
 * - Reuses existing IDs to maintain relationships
 * - Handles duplicates gracefully
 * - Supports incremental updates
 * 
 * Expected Excel structure:
 * Columns: MU | Country | CT | Project Name | Compl (Completion Status)
 * 
 * Example:
 * MU   | Country | CT                    | Project Name           | Compl
 * CEWA | Angola  | MEA CEWA GROWTH CT... | New Project           | A
 * ME   | Qatar   | MEA ENT ME GEL CT...  | Y25 FDD & TDD Upgrade | B
 */

async function smartImportFromExcel(filePath, options = {}) {
  const { 
    clearExisting = false, 
    updateExisting = true, 
    createMissing = true,
    dryRun = false 
  } = options;

  try {
    console.log('Starting Smart Excel import...');
    console.log(`Options: Clear=${clearExisting}, Update=${updateExisting}, Create=${createMissing}, DryRun=${dryRun}`);
    
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Skip header row
    const rows = data.slice(1);
    
    console.log(`Found ${rows.length} data rows`);
    
    if (dryRun) {
      console.log('DRY RUN MODE - No changes will be made to database');
    }
    
    // Clear existing data if requested
    if (clearExisting && !dryRun) {
      console.log('Clearing existing data...');
      await Company.destroy({ where: {} });
      await Project.destroy({ where: {} });
      await CT.destroy({ where: {} });
      await Country.destroy({ where: {} });
      await MU.destroy({ where: {} });
      console.log('Existing data cleared.');
    }
    
    // Statistics
    const stats = {
      mus: { created: 0, existing: 0, updated: 0 },
      countries: { created: 0, existing: 0, updated: 0 },
      cts: { created: 0, existing: 0, updated: 0 },
      projects: { created: 0, existing: 0, updated: 0 },
      companies: { created: 0, existing: 0, updated: 0 }
    };
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) {
        console.warn(`Skipping row ${i + 2}: insufficient data`);
        continue;
      }
      
      const [muName, countryName, ctName, projectName, completionStatus] = row;
      
      if (!muName || !countryName || !ctName || !projectName) {
        console.warn(`Skipping row ${i + 2}: missing required data`);
        continue;
      }
      
      console.log(`\nProcessing row ${i + 2}: ${muName} > ${countryName} > ${ctName} > ${projectName}`);
      
      // 1. Handle MU
      let mu = await findOrCreateMU(muName, stats, dryRun);
      if (!mu) continue;
      
      // 2. Handle Country
      let country = await findOrCreateCountry(countryName, mu.id, stats, dryRun);
      if (!country) continue;
      
      // 3. Handle CT
      let ct = await findOrCreateCT(ctName, country.id, stats, dryRun);
      if (!ct) continue;
      
      // 4. Handle Project
      let project = await findOrCreateProject(projectName, ct.id, completionStatus, stats, dryRun);
      if (!project) continue;
      
      // 5. Handle Company (extract from CT name or use default)
      const companyName = extractCompanyFromCT(ctName) || 'Default Company';
      let company = await findOrCreateCompany(companyName, project.id, stats, dryRun);
      if (!company) continue;
    }
    
    console.log('\n=== IMPORT COMPLETED ===');
    console.log('\nStatistics:');
    console.log(`MUs: ${stats.mus.created} created, ${stats.mus.existing} existing, ${stats.mus.updated} updated`);
    console.log(`Countries: ${stats.countries.created} created, ${stats.countries.existing} existing, ${stats.countries.updated} updated`);
    console.log(`CTs: ${stats.cts.created} created, ${stats.cts.existing} existing, ${stats.cts.updated} updated`);
    console.log(`Projects: ${stats.projects.created} created, ${stats.projects.existing} existing, ${stats.projects.updated} updated`);
    console.log(`Companies: ${stats.companies.created} created, ${stats.companies.existing} existing, ${stats.companies.updated} updated`);
    
    // Display final summary
    if (!dryRun) {
      const muCount = await MU.count();
      const countryCount = await Country.count();
      const ctCount = await CT.count();
      const projectCount = await Project.count();
      const companyCount = await Company.count();
      
      console.log('\nFinal Database Summary:');
      console.log(`MUs: ${muCount}`);
      console.log(`Countries: ${countryCount}`);
      console.log(`CTs: ${ctCount}`);
      console.log(`Projects: ${projectCount}`);
      console.log(`Companies: ${companyCount}`);
    }
    
  } catch (error) {
    console.error('Error in smart import:', error);
  } finally {
    await sequelize.close();
  }
}

// Helper function to find or create MU
async function findOrCreateMU(muName, stats, dryRun) {
  try {
    // Try to find existing MU by name
    let mu = await MU.findOne({ where: { name: muName } });
    
    if (mu) {
      console.log(`  ✓ Found existing MU: ${muName} (ID: ${mu.id})`);
      stats.mus.existing++;
      return mu;
    }
    
    if (!dryRun) {
      // Create new MU
      mu = await MU.create({
        name: muName,
        code: muName.toUpperCase()
      });
      console.log(`  + Created new MU: ${muName} (ID: ${mu.id})`);
      stats.mus.created++;
    } else {
      console.log(`  + Would create new MU: ${muName}`);
      stats.mus.created++;
    }
    
    return mu;
  } catch (error) {
    console.error(`Error handling MU ${muName}:`, error.message);
    return null;
  }
}

// Helper function to find or create Country
async function findOrCreateCountry(countryName, muId, stats, dryRun) {
  try {
    // Try to find existing Country by name and mu_id
    let country = await Country.findOne({ 
      where: { 
        name: countryName,
        mu_id: muId
      } 
    });
    
    if (country) {
      console.log(`    ✓ Found existing Country: ${countryName} (ID: ${country.id})`);
      stats.countries.existing++;
      return country;
    }
    
    if (!dryRun) {
      // Create new Country
      country = await Country.create({
        name: countryName,
        code: countryName.substring(0, 2).toUpperCase(),
        mu_id: muId
      });
      console.log(`    + Created new Country: ${countryName} (ID: ${country.id})`);
      stats.countries.created++;
    } else {
      console.log(`    + Would create new Country: ${countryName}`);
      stats.countries.created++;
    }
    
    return country;
  } catch (error) {
    console.error(`Error handling Country ${countryName}:`, error.message);
    return null;
  }
}

// Helper function to find or create CT
async function findOrCreateCT(ctName, countryId, stats, dryRun) {
  try {
    // Try to find existing CT by name and country_id
    let ct = await CT.findOne({ 
      where: { 
        name: ctName,
        country_id: countryId
      } 
    });
    
    if (ct) {
      console.log(`      ✓ Found existing CT: ${ctName} (ID: ${ct.id})`);
      stats.cts.existing++;
      return ct;
    }
    
    if (!dryRun) {
      // Create new CT
      ct = await CT.create({
        name: ctName,
        code: `${ctName.substring(0, 6).toUpperCase()}_CT`,
        country_id: countryId
      });
      console.log(`      + Created new CT: ${ctName} (ID: ${ct.id})`);
      stats.cts.created++;
    } else {
      console.log(`      + Would create new CT: ${ctName}`);
      stats.cts.created++;
    }
    
    return ct;
  } catch (error) {
    console.error(`Error handling CT ${ctName}:`, error.message);
    return null;
  }
}

// Helper function to find or create Project
async function findOrCreateProject(projectName, ctId, completionStatus, stats, dryRun) {
  try {
    // Try to find existing Project by name and ct_id
    let project = await Project.findOne({ 
      where: { 
        name: projectName,
        ct_id: ctId
      } 
    });
    
    if (project) {
      console.log(`        ✓ Found existing Project: ${projectName} (ID: ${project.id})`);
      stats.projects.existing++;
      return project;
    }
    
    if (!dryRun) {
      // Create new Project
      project = await Project.create({
        name: projectName,
        code: `${projectName.substring(0, 6).toUpperCase()}_PROJ`,
        ct_id: ctId
      });
      console.log(`        + Created new Project: ${projectName} (ID: ${project.id})`);
      stats.projects.created++;
    } else {
      console.log(`        + Would create new Project: ${projectName}`);
      stats.projects.created++;
    }
    
    return project;
  } catch (error) {
    console.error(`Error handling Project ${projectName}:`, error.message);
    return null;
  }
}

// Helper function to find or create Company
async function findOrCreateCompany(companyName, projectId, stats, dryRun) {
  try {
    // Try to find existing Company by name and project_id
    let company = await Company.findOne({ 
      where: { 
        name: companyName,
        project_id: projectId
      } 
    });
    
    if (company) {
      console.log(`          ✓ Found existing Company: ${companyName} (ID: ${company.id})`);
      stats.companies.existing++;
      return company;
    }
    
    if (!dryRun) {
      // Create new Company
      company = await Company.create({
        name: companyName,
        code: `${companyName.substring(0, 6).toUpperCase()}_COMP`,
        project_id: projectId
      });
      console.log(`          + Created new Company: ${companyName} (ID: ${company.id})`);
      stats.companies.created++;
    } else {
      console.log(`          + Would create new Company: ${companyName}`);
      stats.companies.created++;
    }
    
    return company;
  } catch (error) {
    console.error(`Error handling Company ${companyName}:`, error.message);
    return null;
  }
}

// Helper function to extract company name from CT name
function extractCompanyFromCT(ctName) {
  // Common patterns in your data
  const patterns = [
    /Africell/i,
    /Airtel/i,
    /Ooredoo/i,
    /Orange/i,
    /Etisalat/i,
    /Zain/i,
    /Vodacom/i,
    /Mobily/i,
    /DU/i
  ];
  
  for (const pattern of patterns) {
    const match = ctName.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  // If no pattern matches, try to extract the last part after "CT"
  const ctParts = ctName.split('CT');
  if (ctParts.length > 1) {
    const lastPart = ctParts[ctParts.length - 1].trim();
    if (lastPart) {
      return lastPart;
    }
  }
  
  return null;
}

// Function to create sample Excel file based on your image data
function createSampleExcelFromImage() {
  const sampleData = [
    ['MU', 'Country', 'CT', 'Project Name', 'Compl'],
    ['CEWA', 'Angola', 'MEA CEWA GROWTH CT Africell', 'New Project', 'A'],
    ['CEWA', 'Kenya', 'MEA CEWA AIR CT Airtel', 'New Project', 'B'],
    ['ME', 'Qatar', 'MEA ENT ME GEL CT Qatar', 'Y25 FDD & TDD Upgrade 2025-26', 'A'],
    ['ME', 'Kuwait', 'MEA ENT ME GEL CT Kuwait', 'Y25 5G n41 mMIMO Upq AEHC 30MH D', 'B'],
    ['ME', 'Iraq', 'MEA ME IRQ CT Asiacell', 'New Project', 'C'],
    ['ME', 'Jordan', 'MEA ME LEV CT Zain JO', 'Zain PO3', 'A'],
    ['ME', 'UAE', 'MEA ME GULF CT DU AE', 'Y25-Hayah karima', 'B'],
    ['NWA', 'Algeria', 'MEA NWA NA CT Ooredoo', 'New Project', 'A'],
    ['NWA', 'Cameroon', 'MEA NWA OCWA CT Orange', 'Y25 LTE Overlay 1800', 'B'],
    ['NWA', 'Egypt', 'MEA NWA ES CT Etisalat', 'Y25 New Sites 2025-26', 'C'],
    ['NWA', 'Saudi Arabia', 'MEA SAU CT Mobily Saudi', 'OJO PO4', 'A'],
    ['SAV', 'South Africa', 'MEA VFM VCINT CT Vodacom', 'Zain PO2', 'B'],
    ['SAV', 'Tanzania', 'MEA VFM VCINT CT Vodacom', 'New Project', 'C']
  ];
  
  const worksheet = xlsx.utils.aoa_to_sheet(sampleData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Hierarchical Data');
  
  const filePath = path.join(__dirname, 'sample_hierarchical_data_from_image.xlsx');
  xlsx.writeFile(workbook, filePath);
  console.log(`Sample Excel file created based on image: ${filePath}`);
}

// Check if xlsx package is installed
try {
  require('xlsx');
} catch (error) {
  console.error('xlsx package not found. Please install it first:');
  console.error('npm install xlsx');
  process.exit(1);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Smart Excel Import Script');
  console.log('');
  console.log('Usage:');
  console.log('  node smartImportFromExcel.js <excel-file-path> [options]');
  console.log('  node smartImportFromExcel.js --create-sample');
  console.log('  node smartImportFromExcel.js --dry-run <excel-file-path>');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run          Test the import without making changes');
  console.log('  --clear-existing   Clear all existing data before import');
  console.log('  --no-update        Skip updating existing records');
  console.log('  --no-create        Skip creating new records');
  console.log('');
  console.log('Examples:');
  console.log('  node smartImportFromExcel.js ./data/hierarchical_data.xlsx');
  console.log('  node smartImportFromExcel.js ./data/hierarchical_data.xlsx --dry-run');
  console.log('  node smartImportFromExcel.js ./data/hierarchical_data.xlsx --clear-existing');
  console.log('  node smartImportFromExcel.js --create-sample');
} else if (args[0] === '--create-sample') {
  createSampleExcelFromImage();
} else {
  const filePath = args[0];
  const options = {
    dryRun: args.includes('--dry-run'),
    clearExisting: args.includes('--clear-existing'),
    updateExisting: !args.includes('--no-update'),
    createMissing: !args.includes('--no-create')
  };
  
  smartImportFromExcel(filePath, options);
} 