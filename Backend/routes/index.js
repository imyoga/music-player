const express = require('express');
const timerRoutes = require('./timerRoutes');

const router = express.Router();

// Mount timer routes directly at /api root since subdomain handles app separation
router.use('/', timerRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Timer API Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router; 