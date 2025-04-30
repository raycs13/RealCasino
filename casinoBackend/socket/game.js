// Game socket handler for roulette
const { promisePool } = require('../config/db');

// Global variables for game state
let currentRoundId = null;
let roundEndTime = null;
let currentGameState = {
    roundId: null,
    timeLeft: 15,
    inProgress: false,
    isSpinning: false,
    spinStartTime: null
};

let currentBets = {
    red: { total: 0, bets: [] },
    green: { total: 0, bets: [] },
    black: { total: 0, bets: [] }
};

/**
 * Get the last ten roulette spins
 * @returns {Promise<Array>} - Array of past spins
 */
async function getLastTenSpins() {
    try {
        const [spins] = await promisePool.query(`
            SELECT winNumber, winColor 
            FROM rounds 
            WHERE winNumber IS NOT NULL AND winColor IS NOT NULL
            ORDER BY roundid DESC 
            LIMIT 10
        `);
        //console.log('Retrieved spins:', spins);
        return spins.reverse();
    } catch (error) {
        console.error('Error fetching last spins:', error);
        return [];
    }
}

/**
 * Start a new round of roulette
 * @param {Object} io - Socket.IO instance
 */
async function startNewRound(io) {
    try {
        // Insert new round
        const [roundResult] = await promisePool.query(
            'INSERT INTO rounds (gameid) VALUES (1)'
        );
        currentRoundId = roundResult.insertId;

        const lastSpins = await getLastTenSpins();
        io.emit('update_previous_spins', { spins: lastSpins });
        
        currentGameState = {
            roundId: currentRoundId,
            timeLeft: 15,
            inProgress: true,
            isSpinning: false,
            spinStartTime: null
        };
        roundEndTime = Date.now() + 15000;
 
        // Start countdown timer
        const countdownInterval = setInterval(() => {
            currentGameState.timeLeft = Math.ceil((roundEndTime - Date.now()) / 1000);

            if (currentGameState.timeLeft <= 0) {
                clearInterval(countdownInterval);
                currentGameState.isSpinning = true;
                currentGameState.spinStartTime = Date.now();
                io.emit('spin_start'); // Notify clients that spinning has started
            }

            io.emit('time_update', { 
                timeLeft: currentGameState.timeLeft,
                isSpinning: currentGameState.isSpinning 
            });
        }, 1000);
 
        // Emit initial round start
        io.emit('round_start', { 
            roundId: currentRoundId, 
            timeLeft: 15,
            isSpinning: false
        });
 
        // Schedule round end
        setTimeout(() => {
            clearInterval(countdownInterval);
            endRound(io);
        }, 15000);
 
        // Reset bets for new round
        currentBets = {
            red: { total: 0, bets: [] },
            green: { total: 0, bets: [] },
            black: { total: 0, bets: [] }
        };

    } catch (error) {
        console.error('Error starting new round:', error);
    }
}

/**
 * End current round and process results
 * @param {Object} io - Socket.IO instance
 */
async function endRound(io) {
    try {
        currentGameState.isSpinning = true;
        currentGameState.spinStartTime = Date.now();

        // Determine winning number and color
        const result = Math.floor(Math.random() * 15);
        const winColor = result === 0 ? 'green' : 
                       [1,2,3,4,5,6,7].includes(result) ? 'red' : 'black';

        // Save result to database
        await promisePool.query(
           'UPDATE rounds SET winColor = ?, winNumber = ? WHERE roundid = ?',
           [winColor, result, currentRoundId]
        );

        // Get all bets for this round
        const [bets] = await promisePool.query(`
            SELECT gr.userid, gr.betid, b.bet, u.balance, gr.bet_type as type
            FROM game_rounds gr
            JOIN bets b ON gr.betid = b.betid
            JOIN users u ON gr.userid = u.user_id
            WHERE gr.roundid = ?`,
            [currentRoundId]
        );

        // Process winnings
        const userWinnings = new Map();

        for (const bet of bets) {
            const isWin = (bet.type === 'green' && result === 0) ||
                         (bet.type === 'red' && [1,2,3,4,5,6,7].includes(result)) ||
                         (bet.type === 'black' && [8,9,10,11,12,13,14].includes(result));
 
            if (isWin) {
                const multiplier = bet.type === 'green' ? 14 : 2;
                const winAmount = bet.bet * multiplier;
                
                const currentWinnings = userWinnings.get(bet.userid) || 0;
                userWinnings.set(bet.userid, currentWinnings + winAmount);
            }
        }

        // Record payouts and update balances
        for (const [userId, totalWinnings] of userWinnings) {
            await promisePool.query(
                'INSERT INTO payouts (roundid, userid, payout) VALUES (?, ?, ?)',
                [currentRoundId, userId, totalWinnings]
            );

            await promisePool.query(
                'UPDATE users SET balance = balance + ? WHERE user_id = ?',
                [totalWinnings, userId]
            );
        }

        // Emit result to clients
        io.emit('round_end', { result, winColor, isSpinning: true });
        
        // Clear bets display
        io.emit('bets_update', currentBets);
        
        // Wait a moment before starting next round
        setTimeout(() => {
            // Reset game state before starting new round
            currentGameState = {
                roundId: null,
                timeLeft: 15,
                inProgress: false,
                isSpinning: false,
                spinStartTime: null
            };
            
            startNewRound(io);
        }, 9000);
    } catch (error) {
        console.error('Error ending round:', error);
        // Reset game state even if there's an error
        currentGameState = {
            roundId: null,
            timeLeft: 15,
            inProgress: false,
            isSpinning: false,
            spinStartTime: null
        };
    }
}

/**
 * Initialize game socket handlers
 * @param {Object} io - Socket.IO instance
 * @param {Map} connectedUsers - Map of connected users
 */
module.exports = function(io, connectedUsers) {
    io.on('connection', (socket) => {
        console.log('User connected to game:', socket.user.id);
        
        // Send current game state
        socket.on('request_game_state', async () => {
            const lastSpins = await getLastTenSpins();
            socket.emit('update_previous_spins', { spins: lastSpins });
            
            if (currentGameState.inProgress) {
                socket.emit('round_start', {
                    roundId: currentGameState.roundId,
                    timeLeft: Math.ceil((roundEndTime - Date.now()) / 1000)
                });
            }
        });

        // Send current bets
        socket.on('request_current_bets', () => {
            socket.emit('bets_update', currentBets);
        });

        // Handle bet placement
        socket.on('place_bet', async (betData) => {
            try {
                const userId = socket.user.id;
                const { amount, type } = betData;
        
                // Check user's balance
                const [userRows] = await promisePool.query(
                    'SELECT balance, username, profile_pic FROM users WHERE user_id = ?',
                    [userId]
                );
                
                if (userRows[0].balance < amount) {
                    return socket.emit('bet_placed', {
                        success: false,
                        error: 'Insufficient balance'
                    });
                }
        
                // Check if user already has a bet of this type
                const existingBetIndex = currentBets[type].bets.findIndex(bet => bet.userId === userId);
        
                if (existingBetIndex !== -1) {
                    // Update existing bet
                    currentBets[type].total += amount;
                    currentBets[type].bets[existingBetIndex].amount += amount;
                } else {
                    // Create new bet
                    const betInfo = {
                        userId: userId,
                        username: userRows[0].username,
                        profilePic: userRows[0].profile_pic,
                        amount: amount
                    };
                    currentBets[type].bets.push(betInfo);
                    currentBets[type].total += amount;
                }
        
                // Emit updated bets to all clients
                io.emit('bets_update', currentBets);
        
                // Deduct balance
                await promisePool.query(
                    'UPDATE users SET balance = balance - ? WHERE user_id = ?',
                    [amount, userId]
                );
        
                // Insert bet record
                const [betResult] = await promisePool.query(
                    'INSERT INTO bets (bet) VALUES (?)',
                    [amount]
                );
        
                // Link bet to round
                await promisePool.query(
                    'INSERT INTO game_rounds (userid, roundid, betid, bet_type) VALUES (?, ?, ?, ?)',
                    [userId, currentRoundId, betResult.insertId, type]
                );
        
                socket.emit('bet_placed', {
                    success: true,
                    amount,
                    type
                });
        
                // Emit updated balance
                socket.emit('balance_update', {
                    balance: userRows[0].balance - amount
                });
            } catch (error) {
                console.error('Error placing bet:', error);
                socket.emit('bet_placed', {
                    success: false,
                    error: error.message
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected from game:', socket.user.id);
        });
    });

    // Initialize game when server starts
    startNewRound(io);
};