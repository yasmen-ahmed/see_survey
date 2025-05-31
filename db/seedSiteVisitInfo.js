// Replace 'SESSION_ID_1' and 'SESSION_ID_2' with actual session IDs from your Survey table
const sequelize = require('../config/database');
const SiteVisitInfo = require('../models/SiteVisitInfo');

async function seed() {
  try {
    await sequelize.sync(); // ensure table exists
    const dummyEntries = [
      {
        session_id: '2025-05-29T13:18:13.885Z222',
        survey_date: new Date('2025-05-30'),
        surveyor_name: '',
        subcontractor_company: '',
        surveyor_phone: '',
        nokia_representative_name: '',
        nokia_representative_title: '',
        customer_representative_name: '',
        customer_representative_title: ''
      },
      {
        session_id: '2025-05-30T10:39:43.637Zsite1',
        survey_date: new Date('2025-06-01'),
        surveyor_name: '',
        subcontractor_company: '',
        surveyor_phone: '',
        nokia_representative_name: '',
        nokia_representative_title: '',
        customer_representative_name: '',
        customer_representative_title: ''
      }
    ];

    for (const entry of dummyEntries) {
      await SiteVisitInfo.findOrCreate({
        where: { session_id: entry.session_id },
        defaults: entry
      });
    }

    console.log('Dummy data seeded.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding dummy data:', error);
    process.exit(1);
  }
}

seed(); 