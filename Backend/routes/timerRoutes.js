const express = require('express');
const timerController = require('../controllers/timerController');

const router = express.Router();

// Timer routes
router.post('/start', timerController.startTimer);
router.post('/stop', timerController.stopTimer);
router.post('/pause', timerController.pauseTimer);
router.post('/continue', timerController.resumeTimer);
router.post('/set-elapsed', timerController.setElapsedTime);
router.get('/status', timerController.getTimerStatus);
router.get('/stream', timerController.getTimerStream);

module.exports = router; 