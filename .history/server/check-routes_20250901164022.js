/**
 * Routerlarni tekshirish va server ishga tushishini tekshirish uchun utility
 * Ishga tushirish: node check-routes.js
 */

const express = require('express');
const app = express();
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

// Try to import routes one by one to isolate any issues
try {
  console.log('Checking auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading auth routes:', err);
}

try {
  console.log('Checking user routes...');
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading user routes:', err);
}

try {
  console.log('Checking job routes...');
  const jobRoutes = require('./routes/jobs');
  app.use('/api/jobs', jobRoutes);
  console.log('✅ Job routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading job routes:', err);
}

try {
  console.log('Checking jobActions routes...');
  const jobActionsRoutes = require('./routes/jobActions');
  app.use('/api/job-actions', jobActionsRoutes);
  console.log('✅ JobActions routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading jobActions routes:', err);
}

// Start a test server on a different port
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`You can check if routes load correctly without starting the main server`);
  console.log(`Press Ctrl+C to stop`);
});
