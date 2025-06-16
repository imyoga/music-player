const timerService = require('../services/timerService');

class TimerController {
  // Extract access code from request (body, query, or header)
  extractAccessCode(req) {
    return req.body.accessCode || req.query.accessCode || req.headers['x-access-code'];
  }

  // Start a new timer
  async startTimer(req, res) {
    try {
      console.log('📥 START TIMER REQUEST:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      });

      const { duration } = req.body;
      const accessCode = this.extractAccessCode(req);
      
      console.log('🔧 Extracted values:', {
        duration,
        accessCode,
        extractedFrom: {
          body: req.body.accessCode,
          query: req.query.accessCode,
          header: req.headers['x-access-code']
        }
      });
      
      if (!accessCode) {
        console.log('❌ No access code provided');
        return res.status(400).json({
          error: 'Access code is required. Please provide it in request body, query parameters, or x-access-code header.',
        });
      }

      console.log(`🎯 Starting timer with access code: ${accessCode}, duration: ${duration}`);
      const timer = timerService.startTimer(accessCode, duration);
      console.log('✅ Timer created successfully:', timer);
      
      res.json({
        message: 'Timer started successfully',
        timer,
      });
    } catch (error) {
      console.error('❌ START TIMER ERROR:', error);
      res.status(400).json({
        error: error.message,
      });
    }
  }

  // Stop the timer
  async stopTimer(req, res) {
    try {
      const accessCode = this.extractAccessCode(req);
      
      if (!accessCode) {
        return res.status(400).json({
          error: 'Access code is required. Please provide it in request body, query parameters, or x-access-code header.',
        });
      }

      const timer = timerService.stopTimer(accessCode);
      
      res.json({
        message: 'Timer stopped successfully',
        timer: {
          id: timer.id,
          accessCode: timer.accessCode,
          remainingTime: timer.remainingTime,
          isRunning: timer.isRunning,
        },
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  }

  // Pause the timer
  async pauseTimer(req, res) {
    try {
      const accessCode = this.extractAccessCode(req);
      
      if (!accessCode) {
        return res.status(400).json({
          error: 'Access code is required. Please provide it in request body, query parameters, or x-access-code header.',
        });
      }

      const timer = timerService.pauseTimer(accessCode);
      
      res.json({
        message: 'Timer paused successfully',
        timer: {
          id: timer.id,
          accessCode: timer.accessCode,
          remainingTime: timer.remainingTime,
          isRunning: timer.isRunning,
          isPaused: timer.isPaused,
        },
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  }

  // Resume the timer
  async resumeTimer(req, res) {
    try {
      const accessCode = this.extractAccessCode(req);
      
      if (!accessCode) {
        return res.status(400).json({
          error: 'Access code is required. Please provide it in request body, query parameters, or x-access-code header.',
        });
      }

      const timer = timerService.resumeTimer(accessCode);
      
      res.json({
        message: 'Timer resumed successfully',
        timer: {
          id: timer.id,
          accessCode: timer.accessCode,
          remainingTime: timer.remainingTime,
          isRunning: timer.isRunning,
          isPaused: timer.isPaused,
        },
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  }

  // Set elapsed time
  async setElapsedTime(req, res) {
    try {
      const { elapsedTime } = req.body;
      const accessCode = this.extractAccessCode(req);
      
      if (!accessCode) {
        return res.status(400).json({
          error: 'Access code is required. Please provide it in request body, query parameters, or x-access-code header.',
        });
      }

      const timer = timerService.setElapsedTime(accessCode, elapsedTime);
      
      res.json({
        message: 'Elapsed time set successfully',
        timer,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  }

  // Get timer status
  async getTimerStatus(req, res) {
    try {
      const accessCode = this.extractAccessCode(req);
      
      if (!accessCode) {
        return res.status(400).json({
          error: 'Access code is required. Please provide it in query parameters or x-access-code header.',
        });
      }

      const timer = timerService.getTimerStatus(accessCode);
      
      res.json({
        timer,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }

  // Server-Sent Events stream
  async getTimerStream(req, res) {
    try {
      const accessCode = req.query.accessCode || req.headers['x-access-code'];
      
      if (!accessCode) {
        return res.status(400).json({
          error: 'Access code is required. Please provide it in query parameters or x-access-code header.',
        });
      }

      // Validate access code format
      if (!/^\d{6,}$/.test(accessCode.toString())) {
        return res.status(400).json({
          error: 'Access code must be at least 6 digits and contain only numbers.',
        });
      }

      // Set headers for SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Add client to the service with access code
      timerService.addSSEClient(accessCode, res);

      // Handle client disconnect
      req.on('close', () => {
        timerService.removeSSEClient(accessCode, res);
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }

  // Get all active timers (for debugging/admin purposes)
  async getActiveTimers(req, res) {
    try {
      const activeTimers = timerService.getActiveTimers();
      
      res.json({
        message: 'Active timers retrieved successfully',
        count: activeTimers.length,
        timers: activeTimers,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
}

module.exports = new TimerController(); 