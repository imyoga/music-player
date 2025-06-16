const express = require('express');
const timerController = require('../controllers/timerController');

const router = express.Router();

// Timer routes - properly bind 'this' context
router.post('/start', (req, res) => timerController.startTimer(req, res));
router.post('/stop', (req, res) => timerController.stopTimer(req, res));
router.post('/pause', (req, res) => timerController.pauseTimer(req, res));
router.post('/continue', (req, res) => timerController.resumeTimer(req, res));
router.post('/set-elapsed', (req, res) => timerController.setElapsedTime(req, res));
router.get('/status', (req, res) => timerController.getTimerStatus(req, res));
router.get('/stream', (req, res) => timerController.getTimerStream(req, res));

// Debug/admin route
router.get('/active', (req, res) => timerController.getActiveTimers(req, res));

module.exports = router; 