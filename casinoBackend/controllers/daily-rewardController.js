const { pool } = require('../config/db');


const claimDailyReward = (req, res) => {
    const userId = req.user.id;
    const rewardAmount = 10000; // Amount to give users daily - adjust as needed
    
    // First get the user's current data
    const checkUserSql = 'SELECT balance, last_daily_claim FROM users WHERE user_id = ?';
    
    pool.query(checkUserSql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = result[0];
        const currentTime = new Date();
        const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim) : null;
        
        // Check if user has already claimed today
        if (lastClaim) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (lastClaim >= today) {
                // User already claimed today
                return res.status(400).json({ 
                    error: 'Already claimed',
                    nextClaimTime: getNextClaimTime(lastClaim),
                    timeRemaining: getTimeRemaining(lastClaim)
                });
            }
        }
        
        // User is eligible for daily reward
        const newBalance = user.balance + rewardAmount;
        
        const updateSql = 'UPDATE users SET balance = ?, last_daily_claim = NOW() WHERE user_id = ?';
        
        pool.query(updateSql, [newBalance, userId], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: 'Failed to update balance', details: updateErr.message });
            }
            
            return res.status(200).json({ 
                success: true, 
                message: 'Daily reward claimed successfully!',
                reward: rewardAmount,
                newBalance: newBalance
            });
        });
    });
};

// Helper function to calculate next claim time
function getNextClaimTime(lastClaim) {
    const nextDay = new Date(lastClaim);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    return nextDay;
}

// Helper function to get remaining time in hours and minutes
function getTimeRemaining(lastClaim) {
    const nextClaimTime = getNextClaimTime(lastClaim);
    const now = new Date();
    const diffMs = nextClaimTime - now;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
}
const getDailyRewardStatus = (req, res) => {
    const userId = req.user.id;
    
    const sql = 'SELECT last_daily_claim FROM users WHERE user_id = ?';
    
    pool.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const lastClaim = result[0].last_daily_claim ? new Date(result[0].last_daily_claim) : null;
        let canClaim = true;
        let timeRemaining = null;
        
        if (lastClaim) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (lastClaim >= today) {
                // User already claimed today
                canClaim = false;
                const nextClaimTime = getNextClaimTime(lastClaim);
                const now = new Date();
                const diffMs = nextClaimTime - now;
                
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                timeRemaining = { hours, minutes };
            }
        }
        
        return res.status(200).json({ 
            canClaim,
            timeRemaining,
            lastClaim
        });
    });
};

module.exports = {
    claimDailyReward,
    getDailyRewardStatus
};