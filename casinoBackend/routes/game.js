// Game routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getRouletteStats, placeBet } = require('../controllers/gameController');

// Get roulette statistics
router.get('/roulette/stats', getRouletteStats);

// Place a bet
router.post('/place-bet', authenticateToken, placeBet);

module.exports = router;