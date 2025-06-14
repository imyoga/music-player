const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class TimerService {
  constructor() {
    this.timerState = {
      id: null,
      duration: 0, // in tenths of seconds (0.1s precision)
      remainingTime: 0, // in tenths of seconds
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      interval: null,
    };
    
    this.sseClients = [];
    this.loadTimerState();
  }

  // Helper function to save timer state to file
  saveTimerState() {
    const stateToSave = {
      ...this.timerState,
      interval: null, // Don't save the interval object
    };
    
    try {
      fs.writeFileSync(
        path.join(__dirname, '..', config.timer.stateFile),
        JSON.stringify(stateToSave, null, 2)
      );
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }

  // Helper function to load timer state from file
  loadTimerState() {
    try {
      const data = fs.readFileSync(
        path.join(__dirname, '..', config.timer.stateFile),
        'utf8'
      );
      const savedState = JSON.parse(data);
      if (savedState.id) {
        this.timerState = { ...this.timerState, ...savedState, interval: null };
      }
    } catch (error) {
      console.log('No saved timer state found, starting fresh');
    }
  }

  // Helper function to broadcast timer updates to all SSE clients
  broadcastTimerUpdate() {
    const update = {
      id: this.timerState.id,
      duration: this.timerState.duration, // in tenths of seconds
      remainingTime: this.timerState.remainingTime, // in tenths of seconds
      durationSeconds: this.timerState.duration / config.timer.precisionTenths, // for compatibility
      remainingSeconds: this.timerState.remainingTime / config.timer.precisionTenths, // for compatibility
      isRunning: this.timerState.isRunning,
      isPaused: this.timerState.isPaused,
      timestamp: Date.now(),
      precision: 1.0, // indicates 1 second precision
    };

    this.sseClients.forEach((client, index) => {
      try {
        client.write(`data: ${JSON.stringify(update)}\n\n`);
      } catch (error) {
        // Remove disconnected clients
        this.sseClients.splice(index, 1);
      }
    });
  }

  // Helper function to start the timer countdown
  startTimerCountdown() {
    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
    }

    this.timerState.interval = setInterval(() => {
      if (this.timerState.remainingTime > 0) {
        this.timerState.remainingTime -= config.timer.precisionTenths; // Decrement by 1 second (10 tenths)
        this.broadcastTimerUpdate();
        this.saveTimerState();
      } else {
        // Timer finished
        this.timerState.isRunning = false;
        this.timerState.isPaused = false;
        clearInterval(this.timerState.interval);
        this.timerState.interval = null;
        this.broadcastTimerUpdate();
        this.saveTimerState();
      }
    }, config.timer.precision); // 1000ms = 1 second precision
  }

  // Start a new timer
  startTimer(duration) {
    if (!duration || duration <= 0) {
      throw new Error('Invalid duration. Please provide a positive number of seconds.');
    }

    // Stop existing timer if running
    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
    }

    // Convert seconds to tenths of seconds for higher precision
    const durationInTenths = Math.round(parseFloat(duration) * config.timer.precisionTenths);

    // Initialize new timer
    this.timerState = {
      id: Date.now().toString(),
      duration: durationInTenths,
      remainingTime: durationInTenths,
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
      pausedTime: 0,
      interval: null,
    };

    this.startTimerCountdown();
    this.saveTimerState();
    this.broadcastTimerUpdate();

    return this.getTimerStatus();
  }

  // Stop the timer
  stopTimer() {
    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
    }

    this.timerState.isRunning = false;
    this.timerState.isPaused = false;
    this.timerState.remainingTime = 0;
    this.timerState.interval = null;

    this.saveTimerState();
    this.broadcastTimerUpdate();

    return this.getTimerStatus();
  }

  // Pause the timer
  pauseTimer() {
    if (!this.timerState.isRunning || this.timerState.isPaused) {
      throw new Error('Timer is not running or already paused');
    }

    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
      this.timerState.interval = null;
    }

    this.timerState.isPaused = true;
    this.timerState.isRunning = false;

    this.saveTimerState();
    this.broadcastTimerUpdate();

    return this.getTimerStatus();
  }

  // Resume the timer
  resumeTimer() {
    if (!this.timerState.isPaused) {
      throw new Error('Timer is not paused');
    }

    this.timerState.isRunning = true;
    this.timerState.isPaused = false;

    this.startTimerCountdown();
    this.saveTimerState();
    this.broadcastTimerUpdate();

    return this.getTimerStatus();
  }

  // Set elapsed time (adjust remaining time)
  setElapsedTime(elapsedTime) {
    if (!this.timerState.id) {
      throw new Error('No timer is currently active');
    }

    if (elapsedTime === undefined || elapsedTime < 0) {
      throw new Error('Invalid elapsed time. Please provide a non-negative number of seconds.');
    }

    // Convert elapsed time to tenths of seconds
    const elapsedTimeInTenths = Math.round(parseFloat(elapsedTime) * config.timer.precisionTenths);

    // Validate that elapsed time doesn't exceed total duration
    if (elapsedTimeInTenths > this.timerState.duration) {
      throw new Error('Elapsed time cannot exceed total timer duration');
    }

    // Calculate new remaining time
    const newRemainingTime = this.timerState.duration - elapsedTimeInTenths;

    // If elapsed time equals duration, timer should be finished
    if (elapsedTimeInTenths >= this.timerState.duration) {
      // Timer finished
      if (this.timerState.interval) {
        clearInterval(this.timerState.interval);
        this.timerState.interval = null;
      }
      this.timerState.remainingTime = 0;
      this.timerState.isRunning = false;
      this.timerState.isPaused = false;
    } else {
      // Update remaining time
      this.timerState.remainingTime = newRemainingTime;

      // If timer was running, restart the countdown with new remaining time
      if (this.timerState.isRunning && !this.timerState.isPaused) {
        this.startTimerCountdown();
      }
    }

    this.saveTimerState();
    this.broadcastTimerUpdate();

    return {
      ...this.getTimerStatus(),
      elapsedTime: elapsedTimeInTenths,
      elapsedSeconds: elapsedTimeInTenths / config.timer.precisionTenths,
    };
  }

  // Get current timer status
  getTimerStatus() {
    return {
      id: this.timerState.id,
      duration: this.timerState.duration, // in tenths of seconds
      remainingTime: this.timerState.remainingTime, // in tenths of seconds
      durationSeconds: this.timerState.duration / config.timer.precisionTenths, // for compatibility
      remainingSeconds: this.timerState.remainingTime / config.timer.precisionTenths, // for compatibility
      isRunning: this.timerState.isRunning,
      isPaused: this.timerState.isPaused,
      timestamp: Date.now(),
      precision: 1.0, // indicates 1 second precision
    };
  }

  // Add SSE client
  addSSEClient(res) {
    this.sseClients.push(res);
    
    // Send initial timer state
    const initialUpdate = this.getTimerStatus();
    res.write(`data: ${JSON.stringify(initialUpdate)}\n\n`);
  }

  // Remove SSE client
  removeSSEClient(res) {
    const index = this.sseClients.indexOf(res);
    if (index !== -1) {
      this.sseClients.splice(index, 1);
    }
  }

  // Cleanup method
  cleanup() {
    if (this.timerState.interval) {
      clearInterval(this.timerState.interval);
    }
    this.saveTimerState();
  }
}

// Create singleton instance
const timerService = new TimerService();

module.exports = timerService; 