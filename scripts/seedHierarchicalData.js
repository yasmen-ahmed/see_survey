const sequelize = require('../config/database');
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');

// Sample data based on the image structure
const hierarchicalData = [
  {
    mu: { name: 'CEWA', code: 'CEWA' },
    countries: [
      { name: 'Angola', code: 'AO' },
      { name: 'Ethiopia', code: 'ET' },
      { name: 'Ghana', code: 'GH' },
      { name: 'Kenya', code: 'KE' },
      { name: 'Nigeria', code: 'NG' },
      { name: 'Zimbabwe', code: 'ZW' },
      { name: 'Other countries', code: 'OC' }
    ]
  },
  {
    mu: { name: 'ME', code: 'ME' },
    countries: [
      { name: 'Iraq', code: 'IQ' },
      { name: 'Jordan', code: 'JO' },
      { name: 'Kuwait', code: 'KW' },
      { name: 'Lebanon', code: 'LB' },
      { name: 'Pakistan', code: 'PK' },
      { name: 'Qatar', code: 'QA' },
      { name: 'UAE', code: 'AE' },
      { name: 'Other countries', code: 'OC' }
    ]
  },
  {
    mu: { name: 'NWA', code: 'NWA' },
    countries: [
      { name: 'Algeria', code: 'DZ' },
      { name: 'Cameroon', code: 'CM' },
      { name: 'Egypt', code: 'EG' },
      { name: 'Ivory Coast', code: 'CI' },
      { name: 'Other countries', code: 'OC' }
    ]
  }
];

// Sample project data structure (you'll need to customize this based on your actual data)
const projectTemplates = {
  'Angola': [
    { name: 'MEA CEWA GROWTH CT Africell Angola', code: 'CEWA_GROWTH_ANGOLA' }
  ],
  'Kenya': [
    { name: 'MEA CEWA AIR CT Airtel Kenya', code: 'CEWA_AIR_KENYA' }
  ],
  'Qatar': [
    { name: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', code: 'ME_GEL_QATAR' }
  ],
  'Kuwait': [
    { name: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', code: 'ME_GEL_KUWAIT' }
  ],
  'Iraq': [
    { name: 'MEA ME IRQ CT Asiacell Iraq', code: 'ME_IRQ_IRAQ' }
  ],
  'Jordan': [
    { name: 'MEA ME LEV CT Zain JO', code: 'ME_LEV_JORDAN' }
  ],
  'Algeria': [
    { name: 'MEA NWA NA CT Ooredoo Algeria', code: 'NWA_NA_ALGERIA' }
  ],
  'Cameroon': [
    { name: 'MEA NWA OCWA CT Orange Cameroon & CEA Others', code: 'NWA_OCWA_CAMEROON' }
  ],
  'Egypt': [
    { name: 'MEA NWA ES CT Etisalat Egypt', code: 'NWA_ES_EGYPT' }
  ]
};

// Sample company data (you'll need to customize this)
const companyTemplates = {
  'MEA CEWA GROWTH CT Africell Angola': [
    { name: 'Africell Angola', code: 'AFRICELL_ANGOLA' }
  ],
  'MEA CEWA AIR CT Airtel Kenya': [
    { name: 'Airtel Kenya', code: 'AIRTEL_KENYA' }
  ],
  'MEA ENT ME GEL CT Qatar, Kuwait & Iran': [
    { name: 'Qatar Telecom', code: 'QATAR_TELECOM' },
    { name: 'Kuwait Telecom', code: 'KUWAIT_TELECOM' },
    { name: 'Iran Telecom', code: 'IRAN_TELECOM' }
  ],
  'MEA ME IRQ CT Asiacell Iraq': [
    { name: 'Asiacell Iraq', code: 'ASIACELL_IRAQ' }
  ],
  'MEA ME LEV CT Zain JO': [
    { name: 'Zain Jordan', code: 'ZAIN_JORDAN' }
  ],
  'MEA NWA NA CT Ooredoo Algeria': [
    { name: 'Ooredoo Algeria', code: 'OOREDOO_ALGERIA' }
  ],
  'MEA NWA OCWA CT Orange Cameroon & CEA Others': [
    { name: 'Orange Cameroon', code: 'ORANGE_CAMEROON' },
    { name: 'CEA Others', code: 'CEA_OTHERS' }
  ],
  'MEA NWA ES CT Etisalat Egypt': [
    { name: 'Etisalat Egypt', code: 'ETISALAT_EGYPT' }
  ]
};

async function seedHierarchicalData() {
  try {
    console.log('Starting hierarchical data seeding...');

    // Clear existing data (optional - remove if you want to keep existing data)
    await Company.destroy({ where: {} });
    await Project.destroy({ where: {} });
    await CT.destroy({ where: {} });
    await Country.destroy({ where: {} });
    await MU.destroy({ where: {} });

    console.log('Existing data cleared.');

    // Create MUs and their associated data
    for (const muData of hierarchicalData) {
      console.log(`Creating MU: ${muData.mu.name}`);
      
      // Create MU
      const mu = await MU.create(muData.mu);
      
      // Create countries for this MU
      for (const countryData of muData.countries) {
        console.log(`  Creating Country: ${countryData.name}`);
        const country = await Country.create({
          ...countryData,
          mu_id: mu.id
        });

        // For each country, create a CT (you can customize this based on your needs)
        const ct = await CT.create({
          name: `${countryData.name} Territory`,
          code: `${countryData.code}_CT`,
          country_id: country.id
        });

        // Create projects for this CT based on templates
        const projectsForCountry = projectTemplates[countryData.name] || [];
        for (const projectData of projectsForCountry) {
          console.log(`    Creating Project: ${projectData.name}`);
          const project = await Project.create({
            ...projectData,
            ct_id: ct.id
          });

          // Create companies for this project
          const companiesForProject = companyTemplates[projectData.name] || [];
          for (const companyData of companiesForProject) {
            console.log(`      Creating Company: ${companyData.name}`);
            await Company.create({
              ...companyData,
              project_id: project.id
            });
          }
        }
      }
    }

    console.log('Hierarchical data seeding completed successfully!');
    
    // Display summary
    const muCount = await MU.count();
    const countryCount = await Country.count();
    const ctCount = await CT.count();
    const projectCount = await Project.count();
    const companyCount = await Company.count();
    
    console.log('\nData Summary:');
    console.log(`MUs: ${muCount}`);
    console.log(`Countries: ${countryCount}`);
    console.log(`CTs: ${ctCount}`);
    console.log(`Projects: ${projectCount}`);
    console.log(`Companies: ${companyCount}`);

  } catch (error) {
    console.error('Error seeding hierarchical data:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seeding function
seedHierarchicalData(); 