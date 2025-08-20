const express = require('express');
const app = express();

// Import the gallery routes
const galleryRoutes = require('../routes/galleryRoutes');

// Register the routes
app.use('/api/gallery', galleryRoutes);

// Test route to check if gallery routes are registered
app.get('/test-gallery-routes', (req, res) => {
  const routes = [];
  
  // Get all registered routes
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: '/api/gallery' + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    message: 'Gallery routes are registered',
    routes: routes
  });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log('🌐 Test the gallery routes at: http://localhost:3001/test-gallery-routes');
});

module.exports = app; 