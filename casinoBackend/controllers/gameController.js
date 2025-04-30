// Game controllers
const { pool, promisePool } = require('../config/db');

/**
 * Get roulette statistics
 */
const getRouletteStats = (req, res) => {
    const queries = {
        // Get color streaks
        colorStreaks: `
            WITH numbered_rows AS (
                SELECT 
                    roundid,
                    winColor,
                    winNumber,
                    ROW_NUMBER() OVER (ORDER BY roundid) as row_num
                FROM rounds
                WHERE winColor IS NOT NULL
            ),
            color_groups AS (
                SELECT 
                    winColor,
                    roundid,
                    row_num,
                    row_num - ROW_NUMBER() OVER (PARTITION BY winColor ORDER BY row_num) as grp
                FROM numbered_rows
            ),
            color_streaks AS (
                SELECT 
                    winColor,
                    COUNT(*) as streak_length,
                    MIN(roundid) as start_roundid,
                    MAX(roundid) as end_roundid
                FROM color_groups
                GROUP BY winColor, grp
                ORDER BY streak_length DESC
            )
            SELECT * FROM color_streaks LIMIT 1
        `,
        
        // Get number streaks
        numberStreaks: `
            WITH numbered_rows AS (
                SELECT 
                    roundid,
                    winColor,
                    winNumber,
                    ROW_NUMBER() OVER (ORDER BY roundid) as row_num
                FROM rounds
                WHERE winNumber IS NOT NULL
            ),
            number_groups AS (
                SELECT 
                    winNumber,
                    roundid,
                    row_num,
                    row_num - ROW_NUMBER() OVER (PARTITION BY winNumber ORDER BY row_num) as grp
                FROM numbered_rows
            ),
            number_streaks AS (
                SELECT 
                    winNumber,
                    COUNT(*) as streak_length,
                    MIN(roundid) as start_roundid,
                    MAX(roundid) as end_roundid
                FROM number_groups
                GROUP BY winNumber, grp
                ORDER BY streak_length DESC
            )
            SELECT * FROM number_streaks LIMIT 1
        `,
        
        // Get color distribution
        colorDistribution: `
            SELECT 
                winColor,
                COUNT(*) as count
            FROM rounds
            WHERE winColor IS NOT NULL
            GROUP BY winColor
        `,
        
        // Get top numbers
        topNumbers: `
            SELECT 
                winNumber,
                COUNT(*) as count
            FROM rounds
            WHERE winNumber IS NOT NULL
            GROUP BY winNumber
            ORDER BY count DESC
            LIMIT 5
        `,
        
        // Get even/odd distribution
        evenOddDistribution: `
            SELECT 
                CASE WHEN winNumber % 2 = 0 THEN 'even' ELSE 'odd' END as type,
                COUNT(*) as count
            FROM rounds
            WHERE winNumber IS NOT NULL
            GROUP BY CASE WHEN winNumber % 2 = 0 THEN 'even' ELSE 'odd' END
        `,
        
        // Get section distribution
        sectionDistribution: `
            SELECT 
                CASE 
                    WHEN winNumber = 0 THEN 'zero'
                    WHEN winNumber <= 12 THEN '1-12'
                    WHEN winNumber <= 24 THEN '13-24'
                    ELSE '25-36'
                END as section,
                COUNT(*) as count
            FROM rounds
            WHERE winNumber IS NOT NULL
            GROUP BY 
                CASE 
                    WHEN winNumber = 0 THEN 'zero'
                    WHEN winNumber <= 12 THEN '1-12'
                    WHEN winNumber <= 24 THEN '13-24'
                    ELSE '25-36'
                END
        `,
        
        // Get high/low distribution
        highLowDistribution: `
            SELECT 
                CASE 
                    WHEN winNumber = 0 THEN 'zero'
                    WHEN winNumber <= 18 THEN 'low'
                    ELSE 'high'
                END as range_type,
                COUNT(*) as count
            FROM rounds
            WHERE winNumber IS NOT NULL
            GROUP BY 
                CASE 
                    WHEN winNumber = 0 THEN 'zero'
                    WHEN winNumber <= 18 THEN 'low'
                    ELSE 'high'
                END
        `
    };

    const stats = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    // Execute each query
    Object.entries(queries).forEach(([key, query]) => {
        pool.query(query, (err, results) => {
            if (err) {
                console.error(`Error in ${key}:`, err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            stats[key] = results;
            completedQueries++;

            // If all queries are complete, send the response
            if (completedQueries === totalQueries) {
                res.json(stats);
            }
        });
    });
};

/**
 * Place a bet
 */
const placeBet = async (req, res) => {
    const { amount, type } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0 || !type) {
        return res.status(400).json({ error: 'Invalid bet parameters' });
    }

    try {
        // Insert bet
        const [betResult] = await promisePool.query(
            'INSERT INTO bets (bet) VALUES (?)',
            [amount]
        );

        // Link bet to round (assuming currentRoundId is available)
        await promisePool.query(
            'INSERT INTO game_rounds (userid, roundid, betid) VALUES (?, ?, ?)',
            [userId, req.body.roundId, betResult.insertId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error placing bet:', error);
        res.status(500).json({ error: 'Failed to place bet' });
    }
};

module.exports = {
    getRouletteStats,
    placeBet
};