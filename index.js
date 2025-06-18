require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const authMiddleware = require('./middleware/authMiddleware');
const sequelize = require('./config/database');

// Enable CORS for both development and production
app.use(cors({
  origin: [
    'http://localhost:5173', // Development
    'https://see-survey-bmgy.vercel.app',
    'http://localhost:8000'
  ],
  credentials: true
}));

app.use(express.json());

// Routes
const siteLocationRoutes = require('./routes/siteLocationRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const siteVisitInfoRoutes = require('./routes/siteVisitInfoRoutes');
const siteAccessRoutes = require('./routes/siteAccessRoutes');
const siteAreaInfoRoutes = require('./routes/siteAreaInfoRoutes');
const acConnectionInfoRoutes = require('./routes/acConnectionInfoRoutes');
const powerMeterRoutes = require('./routes/powerMeterRoutes');
const acPanelRoutes = require('./routes/acPanelRoutes');
const outdoorGeneralLayoutRoutes = require('./routes/outdoorGeneralLayoutRoutes');
const outdoorCabinetsRoutes = require('./routes/outdoorCabinetsRoutes');
const ranEquipmentRoutes = require('./routes/ranEquipmentRoutes');
const transmissionMWRoutes = require('./routes/transmissionMW');
const dcPowerSystemRoutes = require('./routes/dcPowerSystem');
const antennaStructureRoutes = require('./routes/antennaStructure');
const mwAntennasRoutes = require('./routes/mwAntennas');
const externalDCDistributionRoutes = require('./routes/externalDCDistributionRoutes');
const antennaConfigurationRoutes = require('./routes/antennaConfigurationRoutes');
const radioUnitsRoutes = require('./routes/radioUnitsRoutes');

// Define Sequelize model associations
const User = require('./models/User');
const Survey = require('./models/Survey');
const SiteVisitInfo = require('./models/SiteVisitInfo');
const TransmissionMW = require('./models/TransmissionMW');
const DCPowerSystem = require('./models/DCPowerSystem');
const AntennaStructure = require('./models/AntennaStructure');
const MWAntennas = require('./models/MWAntennas');
const ExternalDCDistribution = require('./models/ExternalDCDistribution');
const AntennaConfiguration = require('./models/AntennaConfiguration');
const RadioUnits = require('./models/RadioUnits');

User.hasMany(Survey, { foreignKey: 'user_id', as: 'surveys' });
User.hasMany(Survey, { foreignKey: 'creator_id', as: 'createdSurveys' });
Survey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Survey.belongsTo(User, { foreignKey: 'creator_id', as: 'createdBy' });
Survey.hasMany(SiteVisitInfo, { foreignKey: 'session_id', sourceKey: 'session_id', as: 'siteVisitInfo' });
SiteVisitInfo.belongsTo(Survey, { foreignKey: 'session_id', targetKey: 'session_id' });
Survey.hasOne(ExternalDCDistribution, { foreignKey: 'session_id', sourceKey: 'session_id', as: 'externalDCDistribution' });
ExternalDCDistribution.belongsTo(Survey, { foreignKey: 'session_id', targetKey: 'session_id' });
Survey.hasOne(AntennaConfiguration, { foreignKey: 'session_id', sourceKey: 'session_id', as: 'antennaConfiguration' });
AntennaConfiguration.belongsTo(Survey, { foreignKey: 'session_id', targetKey: 'session_id' });
Survey.hasOne(RadioUnits, { foreignKey: 'session_id', sourceKey: 'session_id', as: 'radioUnits' });
RadioUnits.belongsTo(Survey, { foreignKey: 'session_id', targetKey: 'session_id' });

app.use('/api/sites', siteLocationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/site-visit-info', siteVisitInfoRoutes);
app.use('/api/site-access', siteAccessRoutes);
app.use('/api/site-area-info', siteAreaInfoRoutes);
app.use('/api/ac-connection-info', acConnectionInfoRoutes);
app.use('/api/power-meter', powerMeterRoutes);
app.use('/api/ac-panel', acPanelRoutes);
app.use('/api/outdoor-general-layout', outdoorGeneralLayoutRoutes);
app.use('/api/outdoor-cabinets', outdoorCabinetsRoutes);
app.use('/api/ran-equipment', ranEquipmentRoutes);
app.use('/api/transmission-mw', transmissionMWRoutes);
app.use('/api/dc-power-system', dcPowerSystemRoutes);
app.use('/api/antenna-structure', antennaStructureRoutes);
app.use('/api/mw-antennas', mwAntennasRoutes);
app.use('/api/external-dc-distribution', externalDCDistributionRoutes);
app.use('/api/antenna-configuration', antennaConfigurationRoutes);
app.use('/api/radio-units', radioUnitsRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Sync database and start server
sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Unable to sync database:', error);
  }); 