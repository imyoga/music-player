const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 45001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'public')));

app.get('/test', (req, res) => {
  res.send('Hello World');
});

// Timer state storage
let timerState = {
  id: null,
  duration: 0, // in tenths of seconds (0.1s precision)
  remainingTime: 0, // in tenths of seconds
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedTime: 0,
  interval: null,
};

// Store connected SSE clients
let sseClients = [];

// Helper function to save timer state to file
const saveTimerState = () => {
  const stateToSave = {
    ...timerState,
    interval: null, // Don't save the interval object
  };
  fs.writeFileSync(
    path.join(__dirname, 'timer.json'),
    JSON.stringify(stateToSave, null, 2)
  );
};

// Helper function to load timer state from file
const loadTimerState = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'timer.json'), 'utf8');
    const savedState = JSON.parse(data);
    if (savedState.id) {
      timerState = { ...timerState, ...savedState, interval: null };
    }
  } catch (error) {
    console.log('No saved timer state found, starting fresh');
  }
};

// Helper function to broadcast timer updates to all SSE clients
const broadcastTimerUpdate = () => {
  const update = {
    id: timerState.id,
    duration: timerState.duration, // in tenths of seconds
    remainingTime: timerState.remainingTime, // in tenths of seconds
    durationSeconds: timerState.duration / 10, // for compatibility
    remainingSeconds: timerState.remainingTime / 10, // for compatibility
    isRunning: timerState.isRunning,
    isPaused: timerState.isPaused,
    timestamp: Date.now(),
    precision: 1.0, // indicates 1 second precision
  };

  sseClients.forEach((client, index) => {
    try {
      client.write(`data: ${JSON.stringify(update)}\n\n`);
    } catch (error) {
      // Remove disconnected clients
      sseClients.splice(index, 1);
    }
  });
};

// Helper function to start the timer countdown
const startTimerCountdown = () => {
  if (timerState.interval) {
    clearInterval(timerState.interval);
  }

  timerState.interval = setInterval(() => {
    if (timerState.remainingTime > 0) {
      timerState.remainingTime -= 10; // Decrement by 1 second (10 tenths)
      broadcastTimerUpdate();
      saveTimerState();
    } else {
      // Timer finished
      timerState.isRunning = false;
      timerState.isPaused = false;
      clearInterval(timerState.interval);
      timerState.interval = null;
      broadcastTimerUpdate();
      saveTimerState();
    }
  }, 1000); // 1000ms = 1 second precision
};

// Load saved timer state on startup
loadTimerState();

// Routes

// Basic health check
app.get('/', (req, res) => {
  res.send({ message: 'Timer API Server is running' });
});

// Start a new timer
app.post('/api/timer/start', (req, res) => {
  const { duration } = req.body; // duration in seconds

  if (!duration || duration <= 0) {
    return res.status(400).json({
      error: 'Invalid duration. Please provide a positive number of seconds.',
    });
  }

  // Stop existing timer if running
  if (timerState.interval) {
    clearInterval(timerState.interval);
  }

  // Convert seconds to tenths of seconds for higher precision
  const durationInTenths = Math.round(parseFloat(duration) * 10);

  // Initialize new timer
  timerState = {
    id: Date.now().toString(),
    duration: durationInTenths,
    remainingTime: durationInTenths,
    isRunning: true,
    isPaused: false,
    startTime: Date.now(),
    pausedTime: 0,
    interval: null,
  };

  startTimerCountdown();
  saveTimerState();
  broadcastTimerUpdate();

  res.json({
    message: 'Timer started successfully',
    timer: {
      id: timerState.id,
      duration: timerState.duration,
      remainingTime: timerState.remainingTime,
      isRunning: timerState.isRunning,
    },
  });
});

// Stop the timer
app.post('/api/timer/stop', (req, res) => {
  if (timerState.interval) {
    clearInterval(timerState.interval);
  }

  timerState.isRunning = false;
  timerState.isPaused = false;
  timerState.remainingTime = 0;
  timerState.interval = null;

  saveTimerState();
  broadcastTimerUpdate();

  res.json({
    message: 'Timer stopped successfully',
    timer: {
      id: timerState.id,
      remainingTime: timerState.remainingTime,
      isRunning: timerState.isRunning,
    },
  });
});

// Pause the timer
app.post('/api/timer/pause', (req, res) => {
  if (!timerState.isRunning || timerState.isPaused) {
    return res.status(400).json({
      error: 'Timer is not running or already paused',
    });
  }

  if (timerState.interval) {
    clearInterval(timerState.interval);
    timerState.interval = null;
  }

  timerState.isPaused = true;
  timerState.isRunning = false;

  saveTimerState();
  broadcastTimerUpdate();

  res.json({
    message: 'Timer paused successfully',
    timer: {
      id: timerState.id,
      remainingTime: timerState.remainingTime,
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
    },
  });
});

// Continue/Resume the timer
app.post('/api/timer/continue', (req, res) => {
  if (!timerState.isPaused) {
    return res.status(400).json({
      error: 'Timer is not paused',
    });
  }

  timerState.isRunning = true;
  timerState.isPaused = false;

  startTimerCountdown();
  saveTimerState();
  broadcastTimerUpdate();

  res.json({
    message: 'Timer resumed successfully',
    timer: {
      id: timerState.id,
      remainingTime: timerState.remainingTime,
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
    },
  });
});

// Set elapsed time (adjust remaining time)
app.post('/api/timer/set-elapsed', (req, res) => {
  const { elapsedTime } = req.body; // elapsed time in seconds

  if (!timerState.id) {
    return res.status(400).json({
      error: 'No timer is currently active',
    });
  }

  if (elapsedTime === undefined || elapsedTime < 0) {
    return res.status(400).json({
      error:
        'Invalid elapsed time. Please provide a non-negative number of seconds.',
    });
  }

  // Convert elapsed time to tenths of seconds
  const elapsedTimeInTenths = Math.round(parseFloat(elapsedTime) * 10);

  // Calculate new remaining time
  const newRemainingTime = timerState.duration - elapsedTimeInTenths;

  // Validate that elapsed time doesn't exceed total duration
  if (elapsedTimeInTenths > timerState.duration) {
    return res.status(400).json({
      error: 'Elapsed time cannot exceed total timer duration',
    });
  }

  // If elapsed time equals duration, timer should be finished
  if (elapsedTimeInTenths >= timerState.duration) {
    // Timer finished
    if (timerState.interval) {
      clearInterval(timerState.interval);
      timerState.interval = null;
    }
    timerState.remainingTime = 0;
    timerState.isRunning = false;
    timerState.isPaused = false;
  } else {
    // Update remaining time
    timerState.remainingTime = newRemainingTime;

    // If timer was running, restart the countdown with new remaining time
    if (timerState.isRunning && !timerState.isPaused) {
      startTimerCountdown();
    }
  }

  saveTimerState();
  broadcastTimerUpdate();

  res.json({
    message: 'Elapsed time set successfully',
    timer: {
      id: timerState.id,
      duration: timerState.duration,
      remainingTime: timerState.remainingTime,
      elapsedTime: elapsedTimeInTenths,
      elapsedSeconds: elapsedTimeInTenths / 10,
      remainingSeconds: timerState.remainingTime / 10,
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
    },
  });
});

// Get current timer status
app.get('/api/timer/status', (req, res) => {
  res.json({
    timer: {
      id: timerState.id,
      duration: timerState.duration, // in tenths of seconds
      remainingTime: timerState.remainingTime, // in tenths of seconds
      durationSeconds: timerState.duration / 10, // for compatibility
      remainingSeconds: timerState.remainingTime / 10, // for compatibility
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
      timestamp: Date.now(),
      precision: 1.0, // indicates 1 second precision
    },
  });
});

// Server-Sent Events endpoint for real-time timer updates
app.get('/api/timer/stream', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Add client to the list
  sseClients.push(res);

  // Send initial timer state
  const initialUpdate = {
    id: timerState.id,
    duration: timerState.duration, // in tenths of seconds
    remainingTime: timerState.remainingTime, // in tenths of seconds
    durationSeconds: timerState.duration / 10, // for compatibility
    remainingSeconds: timerState.remainingTime / 10, // for compatibility
    isRunning: timerState.isRunning,
    isPaused: timerState.isPaused,
    timestamp: Date.now(),
    precision: 1.0, // indicates 1 second precision
  };

  res.write(`data: ${JSON.stringify(initialUpdate)}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Serve the React app for client-side routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/timer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cleanup on server shutdown
process.on('SIGINT', () => {
  if (timerState.interval) {
    clearInterval(timerState.interval);
  }
  saveTimerState();
  process.exit(0);
});

// Create server instance
const server = app.listen(PORT);

// Handle port binding errors (set up before success callback to ensure errors show first)
server.on('error', (err) => {
  console.error('\n🚨 SERVER ERROR 🚨');
  console.error('=' * 50);
  
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ FATAL: Port ${PORT} is already in use!`);
    console.error(`❌ Cannot start server - port conflict detected`);
    console.error(`\n💡 Troubleshooting steps:`);
    console.error(`   1. Check what's using the port: lsof -i :${PORT}`);
    console.error(`   2. Kill the process: kill -9 <PID>`);
    console.error(`   3. Or restart your system to free up ports`);
  } else if (err.code === 'EACCES') {
    console.error(`❌ FATAL: Permission denied to bind to port ${PORT}!`);
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

// Success callback (only runs if no errors)
server.on('listening', () => {
  console.log('\n🚀 SERVER STARTED SUCCESSFULLY 🚀');
  console.log('=' * 50);
  console.log(`⏰ Timestamp: ${new Date()}`);
  console.log(`🌐 Timer API Server is running on port ${PORT}`);
  console.log(`🎵 Timer with 1 second accuracy for smooth music sync`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   POST /api/timer/start       - Start a new timer`);
  console.log(`   POST /api/timer/stop        - Stop the timer`);
  console.log(`   POST /api/timer/pause       - Pause the timer`);
  console.log(`   POST /api/timer/continue    - Resume the timer`);
  console.log(`   POST /api/timer/set-elapsed - Set elapsed time (adjust remaining time)`);
  console.log(`   GET  /api/timer/status      - Get timer status`);
  console.log(`   GET  /api/timer/stream      - Real-time timer updates (SSE, 1s)`);
  console.log(`\n✅ Server ready to accept connections!\n`);
});
