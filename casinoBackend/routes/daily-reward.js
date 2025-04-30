const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { claimDailyReward, getDailyRewardStatus } = require('../controllers/daily-rewardController');


router.post('/claim-daily-reward', authenticateToken, claimDailyReward);
router.get('/daily-reward-status', authenticateToken, getDailyRewardStatus);

module.exports = router;