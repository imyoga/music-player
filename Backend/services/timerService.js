const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class TimerService {
  constructor() {
    // Changed to support multiple timers
    this.timers = new Map(); // accessCode -> timerState
    this.sseClients = new Map(); // accessCode -> [clients]
    this.loadTimerStates();
  }

  // Validate access code (minimum 6 digits)
  validateAccessCode(accessCode) {
    if (!accessCode) {
      throw new Error('Access code is required');
    }
    
    const codeStr = accessCode.toString();
    if (!/^\d{6,}$/.test(codeStr)) {
      throw new Error('Access code must be at least 6 digits and contain only numbers');
    }
    
    return codeStr;
  }

  // Helper function to save all timer states to file
  saveTimerStates() {
    const statesToSave = {};
    
    for (const [accessCode, timer] of this.timers.entries()) {
      statesToSave[accessCode] = {
        ...timer,
        interval: null, // Don't save the interval object
      };
    }
    
    try {
      fs.writeFileSync(
        path.join(__dirname, '..', config.timer.stateFile),
        JSON.stringify(statesToSave, null, 2)
      );
    } catch (error) {
      console.error('Error saving timer states:', error);
    }
  }

  // Helper function to load timer states from file
  loadTimerStates() {
    try {
      const data = fs.readFileSync(
        path.join(__dirname, '..', config.timer.stateFile),
        'utf8'
      );
      const savedStates = JSON.parse(data);
      
      for (const [accessCode, state] of Object.entries(savedStates)) {
        if (state.id) {
          this.timers.set(accessCode, { ...state, interval: null });
        }
      }
      
      console.log(`Loaded ${this.timers.size} timer states from file`);
    } catch (error) {
      console.log('No saved timer states found, starting fresh');
    }
  }

  // Helper function to broadcast timer updates to clients for specific access code
  broadcastTimerUpdate(accessCode) {
    const timer = this.timers.get(accessCode);
    if (!timer) return;

    const now = Date.now();
    const update = {
      id: timer.id,
      accessCode: accessCode,
      duration: timer.duration, // in tenths of seconds
      remainingTime: timer.remainingTime, // in tenths of seconds
      durationSeconds: timer.duration / config.timer.precisionTenths, // for compatibility
      remainingSeconds: timer.remainingTime / config.timer.precisionTenths, // for compatibility
      isRunning: timer.isRunning,
      isPaused: timer.isPaused,
      timestamp: now, // when server sent this update
      serverTime: now, // current server time for sync
      targetEndTime: timer.isRunning && !timer.isPaused 
        ? now + (timer.remainingTime * (config.timer.precision / config.timer.precisionTenths)) // when timer should end
        : null, // null if not running
      precision: 1.0, // indicates 1 second precision
    };

    const clients = this.sseClients.get(accessCode) || [];
    clients.forEach((client, index) => {
      try {
        client.write(`data: ${JSON.stringify(update)}\n\n`);
      } catch (error) {
        // Remove disconnected clients
        clients.splice(index, 1);
      }
    });
  }

  // Helper function to start the timer countdown for specific access code
  startTimerCountdown(accessCode) {
    const timer = this.timers.get(accessCode);
    if (!timer) return;

    if (timer.interval) {
      clearInterval(timer.interval);
    }

    timer.interval = setInterval(() => {
      if (timer.remainingTime > 0) {
        timer.remainingTime -= config.timer.precisionTenths; // Decrement by 1 second (10 tenths)
        this.broadcastTimerUpdate(accessCode);
        this.saveTimerStates();
      } else {
        // Timer finished
        timer.isRunning = false;
        timer.isPaused = false;
        clearInterval(timer.interval);
        timer.interval = null;
        this.broadcastTimerUpdate(accessCode);
        this.saveTimerStates();
      }
    }, config.timer.precision); // 1000ms = 1 second precision
  }

  // Start a new timer with access code
  startTimer(accessCode, duration) {
    console.log(`🚀 TimerService.startTimer called with accessCode: ${accessCode}, duration: ${duration}`);
    
    const validatedCode = this.validateAccessCode(accessCode);
    console.log(`✅ Access code validated: ${validatedCode}`);
    
    if (!duration || duration <= 0) {
      throw new Error('Invalid duration. Please provide a positive number of seconds.');
    }

    // Stop existing timer for this access code if running
    const existingTimer = this.timers.get(validatedCode);
    if (existingTimer && existingTimer.interval) {
      console.log(`🛑 Stopping existing timer for access code: ${validatedCode}`);
      clearInterval(existingTimer.interval);
    }

    // Convert seconds to tenths of seconds for higher precision
    const durationInTenths = Math.round(parseFloat(duration) * config.timer.precisionTenths);
    console.log(`⏱️ Duration converted: ${duration}s → ${durationInTenths} tenths`);

    // Initialize new timer
    const newTimer = {
      id: Date.now().toString(),
      accessCode: validatedCode,
      duration: durationInTenths,
      remainingTime: durationInTenths,
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
      pausedTime: 0,
      interval: null,
    };

    console.log(`🔄 Created new timer object:`, newTimer);

    this.timers.set(validatedCode, newTimer);
    console.log(`📝 Timer stored in map for access code: ${validatedCode}`);
    console.log(`📊 Total timers in map: ${this.timers.size}`);

    this.startTimerCountdown(validatedCode);
    console.log(`⏲️ Timer countdown started for access code: ${validatedCode}`);

    this.saveTimerStates();
    console.log(`💾 Timer states saved to file`);

    this.broadcastTimerUpdate(validatedCode);
    console.log(`📡 Timer update broadcasted for access code: ${validatedCode}`);

    const result = this.getTimerStatus(validatedCode);
    console.log(`📤 Returning timer status:`, result);

    return result;
  }

  // Stop the timer for specific access code
  stopTimer(accessCode) {
    const validatedCode = this.validateAccessCode(accessCode);
    const timer = this.timers.get(validatedCode);
    
    if (!timer) {
      throw new Error('No timer found for this access code');
    }

    if (timer.interval) {
      clearInterval(timer.interval);
    }

    timer.isRunning = false;
    timer.isPaused = false;
    timer.remainingTime = 0;
    timer.interval = null;

    this.saveTimerStates();
    this.broadcastTimerUpdate(validatedCode);

    return this.getTimerStatus(validatedCode);
  }

  // Pause the timer for specific access code
  pauseTimer(accessCode) {
    const validatedCode = this.validateAccessCode(accessCode);
    const timer = this.timers.get(validatedCode);
    
    if (!timer) {
      throw new Error('No timer found for this access code');
    }

    if (!timer.isRunning || timer.isPaused) {
      throw new Error('Timer is not running or already paused');
    }

    if (timer.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
    }

    timer.isPaused = true;
    timer.isRunning = false;

    this.saveTimerStates();
    this.broadcastTimerUpdate(validatedCode);

    return this.getTimerStatus(validatedCode);
  }

  // Resume the timer for specific access code
  resumeTimer(accessCode) {
    const validatedCode = this.validateAccessCode(accessCode);
    const timer = this.timers.get(validatedCode);
    
    if (!timer) {
      throw new Error('No timer found for this access code');
    }

    if (!timer.isPaused) {
      throw new Error('Timer is not paused');
    }

    timer.isRunning = true;
    timer.isPaused = false;

    this.startTimerCountdown(validatedCode);
    this.saveTimerStates();
    this.broadcastTimerUpdate(validatedCode);

    return this.getTimerStatus(validatedCode);
  }

  // Set elapsed time (adjust remaining time) for specific access code
  setElapsedTime(accessCode, elapsedTime) {
    const validatedCode = this.validateAccessCode(accessCode);
    const timer = this.timers.get(validatedCode);
    
    if (!timer) {
      throw new Error('No timer found for this access code');
    }

    if (!timer.id) {
      throw new Error('No timer is currently active for this access code');
    }

    if (elapsedTime === undefined || elapsedTime < 0) {
      throw new Error('Invalid elapsed time. Please provide a non-negative number of seconds.');
    }

    // Convert elapsed time to tenths of seconds
    const elapsedTimeInTenths = Math.round(parseFloat(elapsedTime) * config.timer.precisionTenths);

    // Validate that elapsed time doesn't exceed total duration
    if (elapsedTimeInTenths > timer.duration) {
      throw new Error('Elapsed time cannot exceed total timer duration');
    }

    // Calculate new remaining time
    const newRemainingTime = timer.duration - elapsedTimeInTenths;

    // If elapsed time equals duration, timer should be finished
    if (elapsedTimeInTenths >= timer.duration) {
      // Timer finished
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
      }
      timer.remainingTime = 0;
      timer.isRunning = false;
      timer.isPaused = false;
    } else {
      // Update remaining time
      timer.remainingTime = newRemainingTime;

      // If timer was running, restart the countdown with new remaining time
      if (timer.isRunning && !timer.isPaused) {
        this.startTimerCountdown(validatedCode);
      }
    }

    this.saveTimerStates();
    this.broadcastTimerUpdate(validatedCode);

    return {
      ...this.getTimerStatus(validatedCode),
      elapsedTime: elapsedTimeInTenths,
      elapsedSeconds: elapsedTimeInTenths / config.timer.precisionTenths,
    };
  }

  // Get current timer status for specific access code
  getTimerStatus(accessCode) {
    const validatedCode = this.validateAccessCode(accessCode);
    const timer = this.timers.get(validatedCode);
    
    if (!timer) {
      return {
        id: null,
        accessCode: validatedCode,
        duration: 0,
        remainingTime: 0,
        durationSeconds: 0,
        remainingSeconds: 0,
        isRunning: false,
        isPaused: false,
        timestamp: Date.now(),
        serverTime: Date.now(),
        targetEndTime: null,
        precision: 1.0,
      };
    }

    const now = Date.now();
    return {
      id: timer.id,
      accessCode: validatedCode,
      duration: timer.duration, // in tenths of seconds
      remainingTime: timer.remainingTime, // in tenths of seconds
      durationSeconds: timer.duration / config.timer.precisionTenths, // for compatibility
      remainingSeconds: timer.remainingTime / config.timer.precisionTenths, // for compatibility
      isRunning: timer.isRunning,
      isPaused: timer.isPaused,
      timestamp: now, // when server sent this status
      serverTime: now, // current server time for sync
      targetEndTime: timer.isRunning && !timer.isPaused 
        ? now + (timer.remainingTime * (config.timer.precision / config.timer.precisionTenths)) // when timer should end
        : null, // null if not running
      precision: 1.0, // indicates 1 second precision
    };
  }

  // Add SSE client for specific access code
  addSSEClient(accessCode, res) {
    const validatedCode = this.validateAccessCode(accessCode);
    
    if (!this.sseClients.has(validatedCode)) {
      this.sseClients.set(validatedCode, []);
    }
    
    this.sseClients.get(validatedCode).push(res);
    
    // Always send initial timer state to the new client (even if no timer exists)
    const timerStatus = this.getTimerStatus(validatedCode);
    const update = {
      id: timerStatus.id,
      accessCode: validatedCode,
      duration: timerStatus.duration,
      remainingTime: timerStatus.remainingTime,
      durationSeconds: timerStatus.durationSeconds,
      remainingSeconds: timerStatus.remainingSeconds,
      isRunning: timerStatus.isRunning,
      isPaused: timerStatus.isPaused,
      timestamp: timerStatus.timestamp,
      serverTime: timerStatus.serverTime,
      targetEndTime: timerStatus.targetEndTime,
      precision: timerStatus.precision,
    };
    
    try {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
      console.log(`✅ Sent initial timer state to new SSE client for access code: ${validatedCode}`);
    } catch (error) {
      console.error('❌ Failed to send initial state to SSE client:', error);
      // Remove the client if we can't send to it
      const clients = this.sseClients.get(validatedCode);
      if (clients) {
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      }
    }
  }

  // Remove SSE client
  removeSSEClient(accessCode, res) {
    if (!accessCode) return;
    
    const clients = this.sseClients.get(accessCode);
    if (clients) {
      const index = clients.indexOf(res);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      
      // Remove empty client arrays
      if (clients.length === 0) {
        this.sseClients.delete(accessCode);
      }
    }
  }

  // Get all active timer access codes (for debugging)
  getActiveTimers() {
    const activeTimers = [];
    for (const [accessCode, timer] of this.timers.entries()) {
      if (timer.id) {
        activeTimers.push({
          accessCode,
          id: timer.id,
          isRunning: timer.isRunning,
          isPaused: timer.isPaused,
          remainingSeconds: timer.remainingTime / config.timer.precisionTenths,
        });
      }
    }
    return activeTimers;
  }

  // Cleanup - clear all intervals and save states
  cleanup() {
    for (const [accessCode, timer] of this.timers.entries()) {
      if (timer.interval) {
        clearInterval(timer.interval);
      }
    }
    this.saveTimerStates();
    console.log('Timer service cleanup completed');
  }
}

module.exports = new TimerService(); 