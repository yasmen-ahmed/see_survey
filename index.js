require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
const siteLocationRoutes = require('./routes/siteLocationRoutes');
const surveyRoutes = require('./routes/surveyRoutes');

app.use('/api/sites', siteLocationRoutes);
app.use('/api/surveys', surveyRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 