require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const authMiddleware = require('./middleware/authMiddleware');
const sequelize = require('./config/database');

// Enable CORS for frontend at localhost:5173
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
const siteLocationRoutes = require('./routes/siteLocationRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const siteVisitInfoRoutes = require('./routes/siteVisitInfoRoutes');
const siteAccessRoutes = require('./routes/siteAccessRoutes');

// Define Sequelize model associations
const User = require('./models/User');
const Survey = require('./models/Survey');
const SiteVisitInfo = require('./models/SiteVisitInfo');
User.hasMany(Survey, { foreignKey: 'user_id', as: 'surveys' });
User.hasMany(Survey, { foreignKey: 'creator_id', as: 'createdSurveys' });
Survey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Survey.belongsTo(User, { foreignKey: 'creator_id', as: 'createdBy' });
Survey.hasMany(SiteVisitInfo, { foreignKey: 'session_id', sourceKey: 'session_id', as: 'siteVisitInfo' });
SiteVisitInfo.belongsTo(Survey, { foreignKey: 'session_id', targetKey: 'session_id' });

app.use('/api/sites', siteLocationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/site-visit-info', siteVisitInfoRoutes);
app.use('/api/site-access', siteAccessRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Sync database and start server
sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Unable to sync database:', error);
  }); 