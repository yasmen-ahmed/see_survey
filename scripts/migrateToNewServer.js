const axios = require('axios');
const sequelize = require('../config/database');
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');

/**
 * Migration Script to Copy Hierarchical Data to New Server
 * 
 * This script will:
 * 1. Read all data from current database
 * 2. Create the same data structure on the new server
 * 3. Handle relationships and foreign keys properly
 * 4. Provide detailed logging and error handling
 */

// Configuration
const SOURCE_SERVER = 'http://localhost:3000'; // Current server
const TARGET_SERVER = 'http://10.129.10.227:3000'; // New server
const API_BASE_PATH = '/api/hierarchical-data';

// Statistics tracking
const stats = {
  mus: { read: 0, created: 0, errors: 0 },
  countries: { read: 0, created: 0, errors: 0 },
  cts: { read: 0, created: 0, errors: 0 },
  projects: { read: 0, created: 0, errors: 0 },
  companies: { read: 0, created: 0, errors: 0 }
};

// ID mapping to maintain relationships
const idMapping = {
  mus: new Map(), // oldId -> newId
  countries: new Map(),
  cts: new Map(),
  projects: new Map()
};

/**
 * Test connectivity to both servers
 */
async function testConnectivity() {
  console.log('Testing server connectivity...');
  
  try {
    // Test source server
    console.log(`Testing source server: ${SOURCE_SERVER}${API_BASE_PATH}/mus`);
    const sourceResponse = await axios.get(`${SOURCE_SERVER}${API_BASE_PATH}/mus`);
    console.log(`✓ Source server accessible - Found ${sourceResponse.data.length} MUs`);
    
    // Test target server
    console.log(`Testing target server: ${TARGET_SERVER}${API_BASE_PATH}/mus`);
    const targetResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
    console.log(`✓ Target server accessible - Found ${targetResponse.data.length} MUs`);
    
    return true;
  } catch (error) {
    console.error('✗ Connectivity test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure both servers are running and accessible');
    }
    return false;
  }
}

/**
 * Read all data from source database using Sequelize
 */
async function readSourceData() {
  console.log('\nReading data from source database...');
  
  try {
    // Read MUs
    const mus = await MU.findAll({
      order: [['id', 'ASC']]
    });
    stats.mus.read = mus.length;
    console.log(`✓ Read ${mus.length} MUs from source`);
    
    // Read Countries with MU relationships
    const countries = await Country.findAll({
      include: [{
        model: MU,
        as: 'mu',
        attributes: ['id', 'name']
      }],
      order: [['id', 'ASC']]
    });
    stats.countries.read = countries.length;
    console.log(`✓ Read ${countries.length} Countries from source`);
    
    // Read CTs with Country relationships
    const cts = await CT.findAll({
      include: [{
        model: Country,
        as: 'country',
        attributes: ['id', 'name']
      }],
      order: [['id', 'ASC']]
    });
    stats.cts.read = cts.length;
    console.log(`✓ Read ${cts.length} CTs from source`);
    
    // Read Projects with CT relationships
    const projects = await Project.findAll({
      include: [{
        model: CT,
        as: 'ct',
        attributes: ['id', 'name']
      }],
      order: [['id', 'ASC']]
    });
    stats.projects.read = projects.length;
    console.log(`✓ Read ${projects.length} Projects from source`);
    
    // Read Companies with Project relationships
    const companies = await Company.findAll({
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id', 'name']
      }],
      order: [['id', 'ASC']]
    });
    stats.companies.read = companies.length;
    console.log(`✓ Read ${companies.length} Companies from source`);
    
    return { mus, countries, cts, projects, companies };
  } catch (error) {
    console.error('Error reading source data:', error);
    throw error;
  }
}

/**
 * Create MU on target server
 */
async function createMUOnTarget(mu) {
  try {
    const response = await axios.post(`${TARGET_SERVER}${API_BASE_PATH}/mus`, {
      name: mu.name,
      code: mu.code
    });
    
    if (response.status === 201) {
      const newMU = response.data.data;
      idMapping.mus.set(mu.id, newMU.id);
      console.log(`  ✓ Created MU: ${mu.name} (${mu.id} -> ${newMU.id})`);
      stats.mus.created++;
      return newMU;
    } else if (response.status === 409) {
      // MU already exists, get its ID
      const existingResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      const existingMU = existingResponse.data.find(m => m.name === mu.name);
      if (existingMU) {
        idMapping.mus.set(mu.id, existingMU.id);
        console.log(`  ✓ MU already exists: ${mu.name} (${mu.id} -> ${existingMU.id})`);
        stats.mus.created++;
        return existingMU;
      }
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // Handle existing MU
      const existingResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
      const existingMU = existingResponse.data.find(m => m.name === mu.name);
      if (existingMU) {
        idMapping.mus.set(mu.id, existingMU.id);
        console.log(`  ✓ MU already exists: ${mu.name} (${mu.id} -> ${existingMU.id})`);
        stats.mus.created++;
        return existingMU;
      }
    } else {
      console.error(`  ✗ Error creating MU ${mu.name}:`, error.response?.data?.message || error.message);
      stats.mus.errors++;
    }
  }
  return null;
}

/**
 * Create Country on target server
 */
async function createCountryOnTarget(country) {
  try {
    const newMuId = idMapping.mus.get(country.mu_id);
    if (!newMuId) {
      console.error(`  ✗ Cannot create Country ${country.name}: MU mapping not found`);
      stats.countries.errors++;
      return null;
    }
    
    const response = await axios.post(`${TARGET_SERVER}${API_BASE_PATH}/countries`, {
      name: country.name,
      code: country.code,
      mu_id: newMuId
    });
    
    if (response.status === 201) {
      const newCountry = response.data.data;
      idMapping.countries.set(country.id, newCountry.id);
      console.log(`    ✓ Created Country: ${country.name} (${country.id} -> ${newCountry.id})`);
      stats.countries.created++;
      return newCountry;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // Country already exists, get its ID
      const existingResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/countries/${idMapping.mus.get(country.mu_id)}`);
      const existingCountry = existingResponse.data.find(c => c.name === country.name);
      if (existingCountry) {
        idMapping.countries.set(country.id, existingCountry.id);
        console.log(`    ✓ Country already exists: ${country.name} (${country.id} -> ${existingCountry.id})`);
        stats.countries.created++;
        return existingCountry;
      }
    } else {
      console.error(`    ✗ Error creating Country ${country.name}:`, error.response?.data?.message || error.message);
      stats.countries.errors++;
    }
  }
  return null;
}

/**
 * Create CT on target server
 */
async function createCTOnTarget(ct) {
  try {
    const newCountryId = idMapping.countries.get(ct.country_id);
    if (!newCountryId) {
      console.error(`      ✗ Cannot create CT ${ct.name}: Country mapping not found`);
      stats.cts.errors++;
      return null;
    }
    
    const response = await axios.post(`${TARGET_SERVER}${API_BASE_PATH}/cts`, {
      name: ct.name,
      code: ct.code,
      country_id: newCountryId
    });
    
    if (response.status === 201) {
      const newCT = response.data.data;
      idMapping.cts.set(ct.id, newCT.id);
      console.log(`      ✓ Created CT: ${ct.name} (${ct.id} -> ${newCT.id})`);
      stats.cts.created++;
      return newCT;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // CT already exists, get its ID
      const existingResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/cts/${idMapping.countries.get(ct.country_id)}`);
      const existingCT = existingResponse.data.find(c => c.name === ct.name);
      if (existingCT) {
        idMapping.cts.set(ct.id, existingCT.id);
        console.log(`      ✓ CT already exists: ${ct.name} (${ct.id} -> ${existingCT.id})`);
        stats.cts.created++;
        return existingCT;
      }
    } else {
      console.error(`      ✗ Error creating CT ${ct.name}:`, error.response?.data?.message || error.message);
      stats.cts.errors++;
    }
  }
  return null;
}

/**
 * Create Project on target server
 */
async function createProjectOnTarget(project) {
  try {
    const newCTId = idMapping.cts.get(project.ct_id);
    if (!newCTId) {
      console.error(`        ✗ Cannot create Project ${project.name}: CT mapping not found`);
      stats.projects.errors++;
      return null;
    }
    
    const response = await axios.post(`${TARGET_SERVER}${API_BASE_PATH}/projects`, {
      name: project.name,
      code: project.code,
      ct_id: newCTId
    });
    
    if (response.status === 201) {
      const newProject = response.data.data;
      idMapping.projects.set(project.id, newProject.id);
      console.log(`        ✓ Created Project: ${project.name} (${project.id} -> ${newProject.id})`);
      stats.projects.created++;
      return newProject;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // Project already exists, get its ID
      const existingResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/projects/${idMapping.cts.get(project.ct_id)}`);
      const existingProject = existingResponse.data.find(p => p.name === project.name);
      if (existingProject) {
        idMapping.projects.set(project.id, existingProject.id);
        console.log(`        ✓ Project already exists: ${project.name} (${project.id} -> ${existingProject.id})`);
        stats.projects.created++;
        return existingProject;
      }
    } else {
      console.error(`        ✗ Error creating Project ${project.name}:`, error.response?.data?.message || error.message);
      stats.projects.errors++;
    }
  }
  return null;
}

/**
 * Create Company on target server
 */
async function createCompanyOnTarget(company) {
  try {
    const newProjectId = idMapping.projects.get(company.project_id);
    if (!newProjectId) {
      console.error(`          ✗ Cannot create Company ${company.name}: Project mapping not found`);
      stats.companies.errors++;
      return null;
    }
    
    const response = await axios.post(`${TARGET_SERVER}${API_BASE_PATH}/companies`, {
      name: company.name,
      code: company.code,
      project_id: newProjectId
    });
    
    if (response.status === 201) {
      const newCompany = response.data.data;
      console.log(`          ✓ Created Company: ${company.name} (${company.id} -> ${newCompany.id})`);
      stats.companies.created++;
      return newCompany;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // Company already exists
      console.log(`          ✓ Company already exists: ${company.name}`);
      stats.companies.created++;
      return null;
    } else {
      console.error(`          ✗ Error creating Company ${company.name}:`, error.response?.data?.message || error.message);
      stats.companies.errors++;
    }
  }
  return null;
}

/**
 * Main migration function
 */
async function migrateToNewServer() {
  console.log('Starting migration to new server...');
  console.log(`Source: ${SOURCE_SERVER}`);
  console.log(`Target: ${TARGET_SERVER}`);
  console.log('==================================================');
  
  try {
    // Test connectivity
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.log('\nMigration aborted due to connectivity issues.');
      return;
    }
    
    // Read source data
    const sourceData = await readSourceData();
    
    console.log('\nStarting data migration...');
    console.log('==================================================');
    
    // 1. Migrate MUs first
    console.log('\n1. Migrating MUs...');
    for (const mu of sourceData.mus) {
      await createMUOnTarget(mu);
    }
    
    // 2. Migrate Countries
    console.log('\n2. Migrating Countries...');
    for (const country of sourceData.countries) {
      await createCountryOnTarget(country);
    }
    
    // 3. Migrate CTs
    console.log('\n3. Migrating CTs...');
    for (const ct of sourceData.cts) {
      await createCTOnTarget(ct);
    }
    
    // 4. Migrate Projects
    console.log('\n4. Migrating Projects...');
    for (const project of sourceData.projects) {
      await createProjectOnTarget(project);
    }
    
    // 5. Migrate Companies
    console.log('\n5. Migrating Companies...');
    for (const company of sourceData.companies) {
      await createCompanyOnTarget(company);
    }
    
    // Print final statistics
    console.log('\n==================================================');
    console.log('MIGRATION COMPLETED');
    console.log('==================================================');
    console.log('\nSource Data Read:');
    console.log(`MUs: ${stats.mus.read}`);
    console.log(`Countries: ${stats.countries.read}`);
    console.log(`CTs: ${stats.cts.read}`);
    console.log(`Projects: ${stats.projects.read}`);
    console.log(`Companies: ${stats.companies.read}`);
    
    console.log('\nTarget Data Created:');
    console.log(`MUs: ${stats.mus.created} created, ${stats.mus.errors} errors`);
    console.log(`Countries: ${stats.countries.created} created, ${stats.countries.errors} errors`);
    console.log(`CTs: ${stats.cts.created} created, ${stats.cts.errors} errors`);
    console.log(`Projects: ${stats.projects.created} created, ${stats.projects.errors} errors`);
    console.log(`Companies: ${stats.companies.created} created, ${stats.companies.errors} errors`);
    
    // Verify target data
    console.log('\nVerifying target data...');
    await verifyTargetData();
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

/**
 * Verify the migrated data on target server
 */
async function verifyTargetData() {
  try {
    console.log('\nTarget Server Data Verification:');
    console.log('================================');
    
    const musResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/mus`);
    const mus = musResponse.data;
    
    console.log(`Total MUs on target: ${mus.length}`);
    
    for (const mu of mus) {
      console.log(`\nMU: ${mu.name} (ID: ${mu.id})`);
      
      const countriesResponse = await axios.get(`${TARGET_SERVER}${API_BASE_PATH}/countries/${mu.id}`);
      const countries = countriesResponse.data;
      
      console.log(`  Countries (${countries.length}):`);
      countries.forEach(country => {
        console.log(`    - ${country.name} (ID: ${country.id})`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying target data:', error.message);
  }
}

// Main execution
async function main() {
  console.log('Server Migration Script');
  console.log('=======================');
  
  await migrateToNewServer();
  
  console.log('\nMigration script completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrateToNewServer,
  testConnectivity,
  readSourceData
}; 