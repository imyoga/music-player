const express = require('express');
const timerRoutes = require('./timerRoutes');

const router = express.Router();

// Mount route modules
router.use('/timer', timerRoutes);

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