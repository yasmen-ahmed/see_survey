const sequelize = require('../config/database');
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');

// Data from the image - using the exact names from your database
const hierarchicalData = [
  // CEWA (Central East West Africa) - using existing "CEW" MU
  { mu: 'CEWA', muCode: 'CEWA', country: 'Angola', countryCode: 'AN', ct: 'MEA CEWA GROWTH CT Africell Angola', projectName: 'New Project', company: 'comany A' },
  { mu: 'CEWA', muCode: 'CEWA', country: 'Ethiopia', countryCode: 'ET', ct: 'MEA CEWA GROWTH CT Ethiopia', projectName: 'New Project', company: 'comany A' },
  { mu: 'CEWA', muCode: 'CEWA', country: 'Ghana', countryCode: 'GH', ct: 'MEA CEWA GROWTH CT Ghana', projectName: 'New Project', company: 'comany A' },
  { mu: 'CEWA', muCode: 'CEWA', country: 'Kenya', countryCode: 'KE', ct: 'MEA CEWA AIR CT Airtel Kenya', projectName: 'New Project', company: 'comany A' },
  { mu: 'CEWA', muCode: 'CEWA', country: 'Nigeria', countryCode: 'NI', ct: 'MEA CEWA AIR CT Airtel Nigeria', projectName: 'New Project', company: 'comany A' },
  { mu: 'CEWA', muCode: 'CEWA', country: 'Zimbabwe', countryCode: 'ZIM', ct: 'MEA CEWA AIR CT Airtel ZM, MW', projectName: 'New Project', company: 'comany A' },

  
  // ME (Middle East) - using existing country codes
  { mu: 'ME', muCode: 'ME', country: 'Iran', countryCode: 'IR', ct: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', projectName: 'New Project', company: 'Company B' },
  { mu: 'ME', muCode: 'ME', country: 'Iraq', countryCode: 'IQ', ct: 'MEA ME IRQ CT Asiacell Iraq', projectName: 'New Project', company: 'Company B' },
  { mu: 'ME', muCode: 'ME', country: 'Iraq', countryCode: 'IQ', ct: 'MEA ME IRQ CT Newroz', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Iraq', countryCode: 'IQ', ct: 'MEA ME IRQ CT Ooredoo Iraq', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Iraq', countryCode: 'IQ', ct: 'MEA ME IRQ CT Zain Iraq', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Jordan', countryCode: 'JO', ct: 'MEA ME LEV CT Zain JO', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Jordan', countryCode: 'JO', ct: 'MEA NWA OMENA CT Orange Jordan', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Kuwait', countryCode: 'KW', ct: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Lebanon', countryCode: 'LB', ct: 'MEA ME LEV CT LB & Others', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Other countries', countryCode: 'OT', ct: 'ME - Other CTs', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Pakistan', countryCode: 'PK', ct: 'MEA ME PAK CT Telenor', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Qatar', countryCode: 'QA', ct: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Qatar', countryCode: 'QA', ct: 'MEA ME GULF CT Ooredoo Qatar', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'UAE', countryCode: 'AE', ct: 'MEA ME GULF CT DU AE', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'UAE', countryCode: 'AE', ct: 'MEA ME GULF CT Etisalat AE', projectName: 'New Project', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Jordan', countryCode: 'JO', ct: 'MEA ME LEV CT Zain JO', projectName: 'Zain PO3', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Jordan', countryCode: 'JO', ct: 'MEA ME LEV CT Zain JO', projectName: 'Zain PO2', company: 'Company A' },
  { mu: 'ME', muCode: 'ME', country: 'Jordan', countryCode: 'JO', ct: 'MEA NWA OMENA CT Orange Jordan', projectName: 'OJO PO4', company: 'Company A' },
  
  // NWA (North West Africa) - using existing country codes
  { mu: 'NWA', muCode: 'NWA', country: 'Algeria', countryCode: 'AL', ct: 'MEA NWA NA CT Ooredoo Algeria', projectName: 'New Project', company: 'Company A' },
  { mu: 'NWA', muCode: 'NWA', country: 'Algeria', countryCode: 'AL', ct: 'MEA NWA NA CT Optimum Telecom Algeria', projectName: 'New Project', company: 'Company A' },
  { mu: 'NWA', muCode: 'NWA', country: 'Cameroon', countryCode: 'CA', ct: 'MEA NWA OCWA CT Orange Cameroon & CEA Others', projectName: 'New Project', company: 'Orange' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA ES CT Etisalat Egypt', projectName: 'New Project', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA ES CT Telecom Egypt', projectName: 'New Project', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'New Project', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Ivory Coast', countryCode: 'SO', ct: 'MEA NWA OCWA CT Orange CIV & Growth', projectName: 'New Project', company: 'Orange' },
  { mu: 'NWA', muCode: 'NWA', country: 'Libya', countryCode: 'LI', ct: 'MEA NWA MAO CT Libya', projectName: 'New Project', company: 'Ooredoo' },
  { mu: 'NWA', muCode: 'NWA', country: 'Mali', countryCode: 'MI', ct: 'MEA NWA OWA CT Orange Mali', projectName: 'New Project', company: 'Orange' },
  { mu: 'NWA', muCode: 'NWA', country: 'Morocco', countryCode: 'MO', ct: 'MEA ENT NA CT Morocco', projectName: 'New Project', company: 'Ooredoo' },
  { mu: 'NWA', muCode: 'NWA', country: 'Morocco', countryCode: 'MO', ct: 'MEA NWA MAO CT Maroc Telecom', projectName: 'New Project', company: 'Ooredoo' },
  { mu: 'NWA', muCode: 'NWA', country: 'Senegal', countryCode: 'SE', ct: 'MEA NWA OWA CT Orange Senegal', projectName: 'New Project', company: 'Orange' },
  { mu: 'NWA', muCode: 'NWA', country: 'Sudan', countryCode: 'SU', ct: 'MEA NWA ES CT MTN Sudan', projectName: 'New Project', company: 'Orange' },
  { mu: 'NWA', muCode: 'NWA', country: 'Togo', countryCode: 'TO', ct: 'MEA NWA WA CT Togocom', projectName: 'New Project', company: 'Orange' },
  { mu: 'NWA', muCode: 'NWA', country: 'Tunisia', countryCode: 'TUA', ct: 'MEA NWA NA CT Ooredoo Tunisia', projectName: 'New Project', company: 'Ooredoo' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25_FDD & TDD Upgrade_2025-26', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25_5G_n41_mMIMO Upg_AEHC_30MHz', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25-Hayah karima', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25 Penta Beam', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25 LTE Overlay 1800', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25_New Sites_2025-26', company: 'Etisalat' },
  { mu: 'NWA', muCode: 'NWA', country: 'Egypt', countryCode: 'EG', ct: 'MEA NWA OMENA CT Orange Egypt', projectName: 'Y25_5G n41_4T4R', company: 'Etisalat' },

  // Saudi - using different code to avoid conflict
  { mu: 'Saudi', muCode: 'SAU', country: 'Saudi Arabia', countryCode: 'SA', ct: 'MEA ENT ME KSA CT Saudi Arabia', projectName: 'New Project', company: 'comapany A' },
  { mu: 'Saudi', muCode: 'SAU', country: 'Saudi Arabia', countryCode: 'SA', ct: 'MEA SAU SAU CT Mobily Saudi', projectName: 'New Project', company: 'comapany A' },
  { mu: 'Saudi', muCode: 'SAU', country: 'Saudi Arabia', countryCode: 'SA', ct: 'MEA SAU SAU CT ZAIN Saudi', projectName: 'New Project', company: 'comapany A' },
  { mu: 'Saudi', muCode: 'SAU', country: 'Saudi Arabia ', countryCode: 'SA', ct: 'MEA SAU STC Group CT STC', projectName: 'New Project', company: 'comapany A' },
  { mu: 'Saudi', muCode: 'SAU', country: 'Saudi Arabia', countryCode: 'SA', ct: 'MEA SAU STC Group CT STC Affiliates', projectName: 'New Project', company: 'comapany A' },
  { mu: 'Saudi', muCode: 'SAU', country: 'Saudi Arabia', countryCode: 'SA', ct: 'Saudi - Other CTs', projectName: 'New Project', company: 'comapany A' },
  
  // SAV (South Africa Vodacom) - using existing country codes
  { mu: 'SAV', muCode: 'SAV', country: 'Congo', countryCode: 'CO', ct: 'MEA VFM VCINT CT Vodacom Tanzania & DRC', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'Egypt', countryCode: 'EG', ct: 'MEA VFM VFO CT Vodafone Egypt', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'Ethiopia', countryCode: 'ET', ct: 'MEA VFM SFG CT Safaricom Ethiopia', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'Kenya', countryCode: 'KE', ct: 'MEA VFM SFG CT Safaricom Kenya', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'South Africa', countryCode: 'SA', ct: 'MEA VFM VCZA CT Vodacom ZA', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'Tanzania', countryCode: 'TA', ct: 'MEA VFM VCINT CT Vodacom Tanzania & DRC', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'Qatar', countryCode: 'QA', ct: 'MEA VFM VFO CT Vodafone Qatar', projectName: 'New Project', company: 'comapany A' },
  { mu: 'SAV', muCode: 'SAV', country: 'Other countries', countryCode: 'OT', ct: 'SAV - Other CTs', projectName: 'New Project', company: 'comapany A' },

];

async function findOrCreateMU(muName, muCode) {
  try {
    let mu = await MU.findOne({ where: { code: muCode } });
    if (!mu) {
      mu = await MU.create({ name: muName, code: muCode });
      console.log(`✅ Created MU: ${muName} (${muCode})`);
    } else {
      console.log(`ℹ️  MU already exists: ${muName} (${muCode})`);
    }
    return mu;
  } catch (error) {
    console.error(`❌ Error creating MU ${muName}:`, error.message);
    throw error;
  }
}

async function findOrCreateCountry(countryName, countryCode, muId) {
  try {
    let country = await Country.findOne({ where: { code: countryCode } });
    if (!country) {
      country = await Country.create({ 
        name: countryName, 
        code: countryCode, 
        mu_id: muId 
      });
      console.log(`✅ Created Country: ${countryName} (${countryCode})`);
    } else {
      console.log(`ℹ️  Country already exists: ${countryName} (${countryCode})`);
    }
    return country;
  } catch (error) {
    console.error(`❌ Error creating Country ${countryName}:`, error.message);
    throw error;
  }
}

async function findOrCreateCT(ctName, countryId) {
  try {
    // Generate a unique code for CT based on name
    const ctCode = ctName.replace(/\s+/g, '_').substring(0, 10).toUpperCase();
    
    let ct = await CT.findOne({ 
      where: { 
        country_id: countryId,
        code: ctCode 
      } 
    });
    
    if (!ct) {
      ct = await CT.create({ 
        name: ctName, 
        code: ctCode,
        country_id: countryId 
      });
      console.log(`✅ Created CT: ${ctName} (${ctCode})`);
    } else {
      console.log(`ℹ️  CT already exists: ${ctName} (${ctCode})`);
    }
    return ct;
  } catch (error) {
    console.error(`❌ Error creating CT ${ctName}:`, error.message);
    throw error;
  }
}

async function findOrCreateProject(projectName, ctId) {
  try {
    let project = await Project.findOne({ 
      where: { 
        name: projectName,
        ct_id: ctId 
      } 
    });
    
    if (!project) {
      // Generate a unique code for project
      const projectCode = projectName.replace(/\s+/g, '_').substring(0, 20).toUpperCase();
      
      project = await Project.create({ 
        name: projectName, 
        code: projectCode,
        ct_id: ctId,
        status: 'active',
        is_active: true
      });
      console.log(`✅ Created Project: ${projectName} (${projectCode})`);
    } else {
      console.log(`ℹ️  Project already exists: ${projectName}`);
    }
    return project;
  } catch (error) {
    console.error(`❌ Error creating Project ${projectName}:`, error.message);
    throw error;
  }
}

async function findOrCreateCompany(companyName, projectId) {
  try {
    // Generate a unique code for company
    const companyCode = companyName.replace(/\s+/g, '_').toUpperCase();
    
    let company = await Company.findOne({ 
      where: { 
        project_id: projectId,
        code: companyCode 
      } 
    });
    
    if (!company) {
      company = await Company.create({ 
        name: companyName, 
        code: companyCode,
        project_id: projectId 
      });
      console.log(`✅ Created Company: ${companyName} (${companyCode})`);
    } else {
      console.log(`ℹ️  Company already exists: ${companyName} (${companyCode})`);
    }
    return company;
  } catch (error) {
    console.error(`❌ Error creating Company ${companyName}:`, error.message);
    throw error;
  }
}

async function importHierarchicalData() {
  try {
    console.log('🚀 Starting hierarchical data import...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    const processedData = [];
    
    for (const data of hierarchicalData) {
      try {
        console.log(`📋 Processing: ${data.mu} > ${data.country} > ${data.ct} > ${data.projectName} > ${data.company}`);
        
        // 1. Find or create MU
        const mu = await findOrCreateMU(data.mu, data.muCode);
        
        // 2. Find or create Country
        const country = await findOrCreateCountry(data.country, data.countryCode, mu.id);
        
        // 3. Find or create CT
        const ct = await findOrCreateCT(data.ct, country.id);
        
        // 4. Find or create Project
        const project = await findOrCreateProject(data.projectName, ct.id);
        
        // 5. Find or create Company
        const company = await findOrCreateCompany(data.company, project.id);
        
        processedData.push({
          mu: mu.name,
          country: country.name,
          ct: ct.name,
          project: project.name,
          company: company.name
        });
        
        console.log(`✅ Successfully processed: ${data.mu} > ${data.country} > ${data.ct} > ${data.projectName} > ${data.company}\n`);
        
      } catch (error) {
        console.error(`❌ Failed to process: ${data.mu} > ${data.country} > ${data.ct} > ${data.projectName} > ${data.company}`);
        console.error(`Error: ${error.message}\n`);
      }
    }
    
    console.log('📊 Import Summary:');
    console.log(`Total records processed: ${processedData.length}`);
    console.log(`Successful imports: ${processedData.length}`);
    
    // Generate summary report
    const muCount = new Set(processedData.map(d => d.mu)).size;
    const countryCount = new Set(processedData.map(d => d.country)).size;
    const ctCount = new Set(processedData.map(d => d.ct)).size;
    const projectCount = new Set(processedData.map(d => d.project)).size;
    const companyCount = new Set(processedData.map(d => d.company)).size;
    
    console.log(`\n📈 Unique Records Created/Found:`);
    console.log(`- MUs: ${muCount}`);
    console.log(`- Countries: ${countryCount}`);
    console.log(`- CTs: ${ctCount}`);
    console.log(`- Projects: ${projectCount}`);
    console.log(`- Companies: ${companyCount}`);
    
    console.log('\n🎉 Hierarchical data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importHierarchicalData();
}

module.exports = { importHierarchicalData }; 