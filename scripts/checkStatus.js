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

async function checkStatus() {
    try {
        console.log('🔍 Checking database status...\n');
        await sequelize.authenticate();
        console.log('✅ Database connection successful!\n');

        // Get counts
        const muCount = await MU.count();
        const countryCount = await Country.count();
        const ctCount = await CT.count();
        const projectCount = await Project.count();
        const companyCount = await Company.count();

        // Get MU-Country relationship count
        const relationshipCount = await sequelize.query(
            'SELECT COUNT(*) as count FROM mu_countries',
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log('📊 Current Database Status:');
        console.log(`- MUs: ${muCount}`);
        console.log(`- Countries: ${countryCount}`);
        console.log(`- CTs: ${ctCount}`);
        console.log(`- Projects: ${projectCount}`);
        console.log(`- Companies: ${companyCount}`);
        console.log(`- MU-Country Relationships: ${relationshipCount[0].count}\n`);

        // Show sample data
        console.log('📋 Sample Data:');
        
        const sampleMU = await MU.findOne();
        if (sampleMU) {
            console.log(`Sample MU: ${sampleMU.name} (${sampleMU.code})`);
        }

        const sampleCountry = await Country.findOne();
        if (sampleCountry) {
            console.log(`Sample Country: ${sampleCountry.name} (${sampleCountry.code})`);
        }

        const sampleCT = await CT.findOne();
        if (sampleCT) {
            console.log(`Sample CT: ${sampleCT.name} (${sampleCT.code})`);
        }

        const sampleProject = await Project.findOne();
        if (sampleProject) {
            console.log(`Sample Project: ${sampleProject.name} (${sampleProject.code})`);
        }

        const sampleCompany = await Company.findOne();
        if (sampleCompany) {
            console.log(`Sample Company: ${sampleCompany.name} (${sampleCompany.code})`);
        }

        console.log('\n✅ Status check completed successfully!');

    } catch (error) {
        console.error('❌ Error checking database status:', error);
        throw error;
    } finally {
        await sequelize.close();
        console.log('\n🔌 Database connection closed.');
    }
}

checkStatus(); 