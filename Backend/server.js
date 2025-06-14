const express = require('express');
const cors = require('cors');
const path = require('path');

// Import configuration
const config = require('./config/config');

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes');

// Import services (for cleanup)
const timerService = require('./services/timerService');

// Create Express app
const app = express();

// Trust proxy for correct IP logging
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(logger);

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, config.paths.public)));

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Hello World', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api', apiRoutes);

// Serve React app for client-side routing
app.get('/timer', (req, res) => {
  res.sendFile(path.join(__dirname, config.paths.public, config.paths.frontend.index));
});

// Basic health check (root route)
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Timer API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Express 5.x compatible catch-all - using middleware instead of route pattern
app.use((req, res, next) => {
  // Only handle GET requests that haven't been handled yet
  if (req.method === 'GET') {
    // API routes that don't exist
    if (req.path.startsWith('/api')) {
      res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Serve React app for all other routes (client-side routing)
      res.sendFile(path.join(__dirname, config.paths.public, config.paths.frontend.index));
    }
  } else {
    next();
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Create server instance
const server = app.listen(config.server.port);

// Handle server startup
server.on('error', (err) => {
  console.error('\n🚨 SERVER ERROR 🚨');
  console.error('='.repeat(50));
  
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ FATAL: Port ${config.server.port} is already in use!`);
    console.error(`❌ Cannot start server - port conflict detected`);
    console.error(`\n💡 Troubleshooting steps:`);
    console.error(`   1. Check what's using the port: lsof -i :${config.server.port}`);
    console.error(`   2. Kill the process: kill -9 <PID>`);
    console.error(`   3. Or restart your system to free up ports`);
  } else if (err.code === 'EACCES') {
    console.error(`❌ FATAL: Permission denied to bind to port ${config.server.port}!`);
    console.error(`❌ Insufficient privileges to use this port`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Run with elevated privileges: sudo yarn dev`);
    console.error(`   2. Use a port number above 1024`);
  } else {
    console.error(`❌ FATAL: Unexpected server error occurred`);
    console.error(`❌ Error details:`, err.message);
    console.error(`❌ Error code:`, err.code);
  }
  
  console.error('\n❌ Server startup FAILED - exiting...\n');
  process.exit(1);
});

// Success callback
server.on('listening', () => {
  console.log('\n🚀 SERVER STARTED SUCCESSFULLY 🚀');
  console.log('='.repeat(50));
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Timer API Server is running on port ${config.server.port}`);
  console.log(`🎵 Timer with ${config.timer.precision/1000} second accuracy for smooth music sync`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   POST /api/timer/start       - Start a new timer`);
  console.log(`   POST /api/timer/stop        - Stop the timer`);
  console.log(`   POST /api/timer/pause       - Pause the timer`);
  console.log(`   POST /api/timer/continue    - Resume the timer`);
  console.log(`   POST /api/timer/set-elapsed - Set elapsed time (adjust remaining time)`);
  console.log(`   GET  /api/timer/status      - Get timer status`);
  console.log(`   GET  /api/timer/stream      - Real-time timer updates (SSE)`);
  console.log(`   GET  /api/health            - Health check`);
  console.log(`\n✅ Server ready to accept connections!\n`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Cleanup timer service
    timerService.cleanup();
    console.log('✅ Timer service cleaned up');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Graceful shutdown timeout. Forcing exit...');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
