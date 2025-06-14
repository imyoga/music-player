const timerService = require('../services/timerService');

class TimerController {
  // Start a new timer
  async startTimer(req, res) {
    try {
      const { duration } = req.body;
      const timer = timerService.startTimer(duration);
      
      res.json({
        message: 'Timer started successfully',
        timer,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  }

  // Stop the timer
  async stopTimer(req, res) {
    try {
      const timer = timerService.stopTimer();
      
      res.json({
        message: 'Timer stopped successfully',
        timer: {
          id: timer.id,
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
      const timer = timerService.pauseTimer();
      
      res.json({
        message: 'Timer paused successfully',
        timer: {
          id: timer.id,
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
      const timer = timerService.resumeTimer();
      
      res.json({
        message: 'Timer resumed successfully',
        timer: {
          id: timer.id,
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
      const timer = timerService.setElapsedTime(elapsedTime);
      
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
      const timer = timerService.getTimerStatus();
      
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
      // Set headers for SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Add client to the service
      timerService.addSSEClient(res);

      // Handle client disconnect
      req.on('close', () => {
        timerService.removeSSEClient(res);
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
}

module.exports = new TimerController(); 