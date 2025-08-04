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

// Import models
const MU = require('../models/MU');
const Country = require('../models/Country');
const CT = require('../models/CT');
const Project = require('../models/Project');
const Company = require('../models/Company');

// Create a junction table for MU-Country many-to-many relationship
const MUCountry = sequelize.define('MUCountry', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'mus',
            key: 'id'
        }
    },
    country_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'countries',
            key: 'id'
        }
    }
}, {
    tableName: 'mu_countries',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['mu_id', 'country_id']
        }
    ]
});

// Updated master data with your requirements
const masterData = {
    mus: [
        { name: 'CEWA', code: 'CEWA' },
        { name: 'ME', code: 'ME' },
        { name: 'NWA', code: 'NWA' },
        { name: 'SAV', code: 'SAV' },
        { name: 'Saudi', code: 'SAU' },
    ],
    countries: [
        { name: 'Algeria', code: 'AL', mus: ['NWA'] },
        { name: 'Angola', code: 'AN', mus: ['CEWA'] },
        { name: 'Zimbabwe', code: 'ZM', mus: ['CEWA'] },
        { name: 'Cameroon', code: 'CA', mus: ['NWA'] },
        { name: 'Congo', code: 'CO', mus: ['SAV'] },
        { name: 'Egypt', code: 'EG', mus: ['NWA', 'SAV'] },
        { name: 'Ethiopia', code: 'ET', mus: ['CEWA', 'SAV'] },
        { name: 'Ghana', code: 'GH', mus: ['CEWA'] },
        { name: 'Ivory Coast', code: 'SO', mus: ['NWA'] },
        { name: 'Iran', code: 'IR', mus: ['ME'] },
        { name: 'Iraq', code: 'IQ', mus: ['ME'] },
        { name: 'Jordan', code: 'JO', mus: ['ME'] },
        { name: 'Kenya', code: 'KE', mus: ['CEWA', 'SAV'] },
        { name: 'Kuwait', code: 'KW', mus: ['ME'] },
        { name: 'Lebanon', code: 'LB', mus: ['ME'] },
        { name: 'Libya', code: 'LI', mus: ['NWA'] },
        { name: 'Mali', code: 'MI', mus: ['NWA'] },
        { name: 'Morocco', code: 'MO', mus: ['NWA'] },
        { name: 'Nigeria', code: 'NI', mus: ['CEWA'] },
        { name: 'Other countries', code: 'OT', mus: ['ME', 'SAV'] },
        { name: 'Pakistan', code: 'PK', mus: ['ME'] },
        { name: 'Qatar', code: 'QA', mus: ['ME', 'SAV'] },
        { name: 'Saudi Arabia', code: 'SA', mus: ['SAU'] },
        { name: 'Senegal', code: 'SE', mus: ['NWA'] },
        { name: 'South Africa', code: 'ZA', mus: ['SAV'] },
        { name: 'Sudan', code: 'SU', mus: ['NWA'] },
        { name: 'Tanzania', code: 'TA', mus: ['SAV'] },
        { name: 'Togo', code: 'TO', mus: ['NWA'] },
        { name: 'Tunisia', code: 'TUA', mus: ['NWA'] },
        { name: 'UAE', code: 'AE', mus: ['ME'] },
    ],

    cts: [
        // CEWA CTs
        { name: 'MEA CEWA GROWTH CT Africell Angola', code: 'CEW_ANG', country: 'AN' },
        { name: 'MEA CEWA GROWTH CT Ethiopia', code: 'CEW_Eth', country: 'ET' },
        { name: 'MEA CEWA GROWTH CT Ghana', code: 'CEW_GHA', country: 'GH' },
        { name: 'MEA CEWA AIR CT Airtel Kenya', code: 'CEW_KEN', country: 'KE' },
        { name: 'MEA CEWA AIR CT Airtel Nigeria', code: 'CEW_NIG', country: 'NI' },
        { name: 'MEA CEWA AIR CT Airtel ZM, MW', code: 'CEW_ZM', country: 'ZM' },


        // ME CTs
        { name: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', code: 'ME_GEL_QA_KW_IR', country: 'IR' },
        { name: 'MEA ME IRQ CT Asiacell Iraq', code: 'ME_IRQ_ASIACELL', country: 'IQ' },
        { name: 'MEA ME IRQ CT Newroz', code: 'ME_IRQ_NEWROZ', country: 'IQ' },
        { name: 'MEA ME IRQ CT Ooredoo Iraq', code: 'ME_IRQ_OORE', country: 'IQ' },
        { name: 'MEA ME IRQ CT Zain Iraq', code: 'ME_IRQ_ZAIN', country: 'IQ' },
        { name: 'MEA ME LEV CT Zain JO', code: 'ME_JO_ZAIN', country: 'JO' },
        { name: 'MEA NWA OMENA CT Orange Jordan', code: 'ME_JO_ORG', country: 'JO' },
        { name: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', code: 'ME_GEL_QA_KW_IR', country: 'KW' },
        { name: 'MEA ME LEV CT LB & Others', code: 'ME_LB_OTHERS', country: 'LB' },
        { name: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran', code: 'ME_GEL_QA_KW_IR', country: 'QA' },
        { name: 'MEA ME PAK CT Telenor', code: 'ME_PK_TEL', country: 'PK' },
        { name: 'MEA ME GULF CT Ooredoo Qatar', code: 'ME_QA_OORE', country: 'QA' },
        { name: 'MEA ME GULF CT DU AE', code: 'ME_AE_DU', country: 'AE' },
        { name: 'MEA ME GULF CT Etisalat AE', code: 'ME_AE_ETISALAT', country: 'AE' },
        { name: 'ME - Other CTs', code: 'ME_OTHER', country: 'OT' },

        // NWA CTs
        { name: 'MEA NWA NA CT Ooredoo Algeria', code: 'NWA_AL_OOR', country: 'AL' },
        { name: 'MEA NWA NA CT Optimum Telecom Algeria', code: 'NWA_AL_OPT', country: 'AL' },

        { name: 'MEA NWA OCWA CT Orange Cameroon & CEA Others', code: 'NWA_CA_ORG', country: 'CA' },

        { name: 'MEA NWA ES CT Etisalat Egypt', code: 'NWA_EG_ETIS', country: 'EG' },
        { name: 'MEA NWA ES CT Telecom Egypt', code: 'NWA_EG_TEL', country: 'EG' },

        { name: 'MEA NWA OMENA CT Orange Egypt', code: 'NWA_EG_ORG', country: 'EG' },

        { name: 'MEA NWA OCWA CT Orange CIV & Growth', code: 'NWA_SO_ORG', country: 'SO' },

        { name: 'MEA NWA MAO CT Libya', code: 'NWA_LI_OOR', country: 'LI' },

        { name: 'MEA NWA OWA CT Orange Mali', code: 'NWA_MI_ORG', country: 'MI' },

        { name: 'MEA ENT NA CT Morocco', code: 'NWA_MO_ENT', country: 'MO' },
        { name: 'MEA NWA MAO CT Maroc Telecom', code: 'NWA_MO_MAROC', country: 'MO' },

        { name: 'MEA NWA OWA CT Orange Senegal', code: 'NWA_SE_ORG', country: 'SE' },

        { name: 'MEA NWA ES CT MTN Sudan', code: 'NWA_SU_MTN', country: 'SU' },

        { name: 'MEA NWA WA CT Togocom', code: 'NWA_TO_TOGO', country: 'TO' },

        { name: 'MEA NWA NA CT Ooredoo Tunisia', code: 'NWA_TUA_OOR', country: 'TUA' },

        // Saudi CTs
        { name: 'MEA ENT ME KSA CT Saudi Arabia', code: 'SAU_KSA_ENT', country: 'SA' },
        { name: 'MEA SAU SAU CT Mobily Saudi', code: 'SAU_MOBILY', country: 'SA' },
        { name: 'MEA SAU SAU CT ZAIN Saudi', code: 'SAU_ZAIN', country: 'SA' },
        { name: 'MEA SAU STC Group CT STC', code: 'SAU_STC', country: 'SA' },
        { name: 'MEA SAU STC Group CT STC Affiliates', code: 'SAU_STC_AFF', country: 'SA' },
        { name: 'Saudi - Other CTs', code: 'SAU_OTHER', country: 'SA' },
        // SAV CTs
        { name: 'MEA VFM VCINT CT Vodacom Tanzania & DRC', code: 'SAV_TA_CO_VOD', country: 'TA' },
        { name: 'MEA VFM VCINT CT Vodacom Tanzania & DRC', code: 'SAV_TA_CO_VOD', country: 'CO' },

        { name: 'MEA VFM VFO CT Vodafone Egypt', code: 'SAV_EG_VFO', country: 'EG' },

        { name: 'MEA VFM SFG CT Safaricom Ethiopia', code: 'SAV_ET_SFG', country: 'ET' },
        { name: 'MEA VFM SFG CT Safaricom Kenya', code: 'SAV_KE_SFG', country: 'KE' },

        { name: 'MEA VFM VCZA CT Vodacom ZA', code: 'SAV_ZA_VCZA', country: 'ZA' },

        { name: 'MEA VFM VFO CT Vodafone Qatar', code: 'SAV_QA_VFO', country: 'QA' },

        { name: 'SAV - Other CTs', code: 'SAV_OTHER', country: 'OT' },

    ],
    projects: [
        // CEWA Projects
        { name: 'NEW project1', code: 'n_p_1', ct: 'MEA CEWA GROWTH CT Africell Angola' },
        { name: 'NEW project2', code: 'n_p_2', ct: 'MEA CEWA GROWTH CT Ethiopia' },
        { name: 'NEW project3', code: 'n_p_3', ct: 'MEA CEWA GROWTH CT Ghana' },
        { name: 'NEW project4', code: 'n_p_4', ct: 'MEA CEWA AIR CT Airtel Kenya' },
        { name: 'NEW project5', code: 'n_p_5', ct: 'MEA CEWA AIR CT Airtel Nigeria' },
        { name: 'NEW project6', code: 'n_p_6', ct: 'MEA CEWA AIR CT Airtel ZM, MW' },

        // ME Projects
        { name: 'New Project', code: 'me_p_1', ct: 'MEA ENT ME GEL CT Qatar, Kuwait & Iran' },
        { name: 'New Project', code: 'me_p_2', ct: 'MEA ME IRQ CT Asiacell Iraq' },
        { name: 'New Project', code: 'me_p_3', ct: 'MEA ME IRQ CT Newroz' },
        { name: 'New Project', code: 'me_p_4', ct: 'MEA ME IRQ CT Ooredoo Iraq' },
        { name: 'New Project', code: 'me_p_5', ct: 'MEA ME IRQ CT Zain Iraq' },
        { name: 'New Project', code: 'me_p_6', ct: 'MEA ME LEV CT Zain JO' },
        { name: 'New Project', code: 'me_p_7', ct: 'MEA NWA OMENA CT Orange Jordan' },
        { name: 'New Project', code: 'me_p_8', ct: 'MEA ME LEV CT LB & Others' },
        { name: 'New Project', code: 'me_p_9', ct: 'ME - Other CTs' },
        { name: 'New Project', code: 'me_p_10', ct: 'MEA ME PAK CT Telenor' },
        { name: 'New Project', code: 'me_p_11', ct: 'MEA ME GULF CT Ooredoo Qatar' },
        { name: 'New Project', code: 'me_p_12', ct: 'MEA ME GULF CT DU AE' },
        { name: 'New Project', code: 'me_p_13', ct: 'MEA ME GULF CT Etisalat AE' },
        { name: 'Zain PO3', code: 'me_p_14', ct: 'MEA ME LEV CT Zain JO' },
        { name: 'Zain PO2', code: 'me_p_15', ct: 'MEA ME LEV CT Zain JO' },
        { name: 'OJO PO4', code: 'me_p_16', ct: 'MEA NWA OMENA CT Orange Jordan' },

        // NWA Projects
        { name: 'New Project', code: 'nwa_p_1', ct: 'MEA NWA NA CT Ooredoo Algeria' },
        { name: 'New Project', code: 'nwa_p_2', ct: 'MEA NWA NA CT Optimum Telecom Algeria' },
        { name: 'New Project', code: 'nwa_p_3', ct: 'MEA NWA OCWA CT Orange Cameroon & CEA Others' },
        { name: 'New Project', code: 'nwa_p_4', ct: 'MEA NWA ES CT Etisalat Egypt' },
        { name: 'New Project', code: 'nwa_p_5', ct: 'MEA NWA ES CT Telecom Egypt' },
        { name: 'New Project', code: 'nwa_p_6', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'New Project', code: 'nwa_p_7', ct: 'MEA NWA OCWA CT Orange CIV & Growth' },
        { name: 'New Project', code: 'nwa_p_8', ct: 'MEA NWA MAO CT Libya' },
        { name: 'New Project', code: 'nwa_p_9', ct: 'MEA NWA OWA CT Orange Mali' },
        { name: 'New Project', code: 'nwa_p_10', ct: 'MEA ENT NA CT Morocco' },
        { name: 'New Project', code: 'nwa_p_11', ct: 'MEA NWA MAO CT Maroc Telecom' },
        { name: 'New Project', code: 'nwa_p_12', ct: 'MEA NWA OWA CT Orange Senegal' },
        { name: 'New Project', code: 'nwa_p_13', ct: 'MEA NWA ES CT MTN Sudan' },
        { name: 'New Project', code: 'nwa_p_14', ct: 'MEA NWA WA CT Togocom' },
        { name: 'New Project', code: 'nwa_p_15', ct: 'MEA NWA NA CT Ooredoo Tunisia' },

        // Specific Egypt projects with different names under the same CT
        { name: 'Y25_FDD & TDD Upgrade_2025-26', code: 'nwa_p_16', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'Y25_5G_n41_mMIMO Upg_AEHC_30MHz', code: 'nwa_p_17', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'Y25-Hayah karima', code: 'nwa_p_18', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'Y25 Penta Beam', code: 'nwa_p_19', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'Y25 LTE Overlay 1800', code: 'nwa_p_20', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'Y25_New Sites_2025-26', code: 'nwa_p_21', ct: 'MEA NWA OMENA CT Orange Egypt' },
        { name: 'Y25_5G n41_4T4R', code: 'nwa_p_22', ct: 'MEA NWA OMENA CT Orange Egypt' },
        // Saudi Projects
        { name: 'New Project', code: 'sa_p_1', ct: 'MEA ENT ME KSA CT Saudi Arabia' },
        { name: 'New Project', code: 'sa_p_2', ct: 'MEA SAU SAU CT Mobily Saudi' },
        { name: 'New Project', code: 'sa_p_3', ct: 'MEA SAU SAU CT ZAIN Saudi' },
        { name: 'New Project', code: 'sa_p_4', ct: 'MEA SAU STC Group CT STC' },
        { name: 'New Project', code: 'sa_p_5', ct: 'MEA SAU STC Group CT STC Affiliates' },
        { name: 'New Project', code: 'sa_p_6', ct: 'Saudi - Other CTs' },

        // SAV Projects
        { name: 'New Project', code: 'sav_p_1', ct: 'MEA VFM VCINT CT Vodacom Tanzania & DRC' },
        { name: 'New Project', code: 'sav_p_2', ct: 'MEA VFM VFO CT Vodafone Egypt' },
        { name: 'New Project', code: 'sav_p_3', ct: 'MEA VFM SFG CT Safaricom Ethiopia' },
        { name: 'New Project', code: 'sav_p_4', ct: 'MEA VFM SFG CT Safaricom Kenya' },
        { name: 'New Project', code: 'sav_p_5', ct: 'MEA VFM VCZA CT Vodacom ZA' },
        { name: 'New Project', code: 'sav_p_6', ct: 'MEA VFM VCINT CT Vodacom Tanzania & DRC' },
        { name: 'New Project', code: 'sav_p_7', ct: 'MEA VFM VFO CT Vodafone Qatar' },
        { name: 'New Project', code: 'sav_p_8', ct: 'SAV - Other CTs' }
    ],
    companies: [
        // We'll create companies for all projects dynamically in the script
        { name: 'Company A', code: 'COMPANY_A' }
        // { name: 'Company B', code: 'COMPANY_B' }
    ]
};

async function resetAndPopulate() {
    try {
        console.log('🚀 Starting database reset and population...\n');

        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.\n');

        // Create MU-Country junction table if it doesn't exist
        await MUCountry.sync({ alter: true });
        console.log('✅ MU-Country junction table synchronized.\n');

        // Step 1: Clear all existing data
        console.log('🗑️  Step 1: Clearing existing data...');

        // Clear in reverse order to avoid foreign key constraints
        await Company.destroy({ where: {}, force: true });
        console.log('✅ Cleared Companies');

        await Project.destroy({ where: {}, force: true });
        console.log('✅ Cleared Projects');

        await CT.destroy({ where: {}, force: true });
        console.log('✅ Cleared CTs');

        await MUCountry.destroy({ where: {}, force: true });
        console.log('✅ Cleared MU-Country relationships');

        await Country.destroy({ where: {}, force: true });
        console.log('✅ Cleared Countries');

        await MU.destroy({ where: {}, force: true });
        console.log('✅ Cleared MUs');

        console.log('✅ All existing data cleared.\n');

        const muMap = new Map();
        const countryMap = new Map();
        const ctMap = new Map();
        const projectMap = new Map();
        const companyMap = new Map();

        // Step 2: Create all MUs
        console.log('📋 Step 2: Creating MUs...');
        for (const muData of masterData.mus) {
            const mu = await MU.create({
                name: muData.name,
                code: muData.code
            });
            console.log(`✅ Created MU: ${muData.name} (${muData.code})`);
            muMap.set(mu.code, mu);
        }
        console.log(`✅ Created ${muMap.size} MUs.\n`);

        // Step 3: Create all Countries
        console.log('📋 Step 3: Creating Countries...');
        for (const countryData of masterData.countries) {
            const tempMU = await MU.findOne();
            const country = await Country.create({
                name: countryData.name,
                code: countryData.code,
                mu_id: tempMU ? tempMU.id : 1
            });
            console.log(`✅ Created Country: ${countryData.name} (${countryData.code})`);
            countryMap.set(country.code, country);
        }
        console.log(`✅ Created ${countryMap.size} Countries.\n`);

        // Step 4: Create MU-Country relationships
        console.log('📋 Step 4: Creating MU-Country relationships...');
        let relationshipCount = 0;
        for (const countryData of masterData.countries) {
            const country = countryMap.get(countryData.code);
            if (!country) continue;

            for (const muCode of countryData.mus) {
                const mu = muMap.get(muCode);
                if (!mu) continue;

                await MUCountry.create({
                    mu_id: mu.id,
                    country_id: country.id
                });
                console.log(`✅ Created MU-Country relationship: ${mu.name} - ${country.name}`);
                relationshipCount++;
            }
        }
        console.log(`✅ Created ${relationshipCount} MU-Country relationships.\n`);

        // Step 5: Create all CTs
        console.log('📋 Step 5: Creating CTs...');
        for (const ctData of masterData.cts) {
            const country = countryMap.get(ctData.country);
            if (!country) {
                console.log(`⚠️  Country not found: ${ctData.country}`);
                continue;
            }

            const ct = await CT.create({
                name: ctData.name,
                code: ctData.code,
                country_id: country.id
            });
            console.log(`✅ Created CT: ${ctData.name} (${ctData.code})`);
            ctMap.set(ctData.name, ct);
        }
        console.log(`✅ Created ${ctMap.size} CTs.\n`);

        // Step 6: Create all Projects
        console.log('📋 Step 6: Creating Projects...');
        for (const projectData of masterData.projects) {
            const ct = ctMap.get(projectData.ct);
            if (!ct) {
                console.log(`⚠️  CT not found: ${projectData.ct}`);
                continue;
            }

            const project = await Project.create({
                name: projectData.name,
                code: projectData.code,
                ct_id: ct.id,
                status: 'active',
                is_active: true
            });
            console.log(`✅ Created Project: ${projectData.name} (${projectData.code})`);
            projectMap.set(projectData.name, project);
        }
        console.log(`✅ Created ${projectMap.size} Projects.\n`);

        // Step 7: Create all Companies
        console.log('📋 Step 7: Creating Companies...');
        let companyCount = 0;
        
        // Create companies for all projects
        for (const project of projectMap.values()) {
            for (const companyData of masterData.companies) {
                const company = await Company.create({
                    name: companyData.name,
                    code: `${companyData.code}_${project.code}`,
                    project_id: project.id
                });
                console.log(`✅ Created Company: ${companyData.name} for project ${project.name} (${company.code})`);
                companyCount++;
            }
        }
        console.log(`✅ Created ${companyCount} Companies for all projects.\n`);

        // Final summary
        const finalMUCount = await MU.count();
        const finalCountryCount = await Country.count();
        const finalCTCount = await CT.count();
        const finalProjectCount = await Project.count();
        const finalCompanyCount = await Company.count();
        const finalRelationshipCount = await MUCountry.count();

        console.log('📊 Final Database Status:');
        console.log(`- MUs: ${finalMUCount} (Expected: ${masterData.mus.length})`);
        console.log(`- Countries: ${finalCountryCount} (Expected: ${masterData.countries.length})`);
        console.log(`- CTs: ${finalCTCount} (Expected: ${masterData.cts.length})`);
        console.log(`- Projects: ${finalProjectCount} (Expected: ${masterData.projects.length})`);
        console.log(`- Companies: ${finalCompanyCount} (Expected: ${masterData.companies.length})`);
        console.log(`- MU-Country Relationships: ${finalRelationshipCount}`);

        console.log('\n🎉 Database reset and population completed successfully!');

    } catch (error) {
        console.error('❌ Fatal error during reset and population:', error);
    } finally {
        await sequelize.close();
        console.log('🔌 Database connection closed.');
    }
}

// Run the reset and population
resetAndPopulate(); 