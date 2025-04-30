// Chat socket handler
const { pool, promisePool } = require('../config/db');

/**
 * Handle command messages
 * @param {Object} socket - Socket.IO socket object
 * @param {string} message - Message content
 * @param {Object} pool - MySQL connection pool
 * @returns {Promise<boolean>} - Whether the message was a command
 */
const handleCommands = async (socket, message, pool) => {
    // If message doesn't start with /, treat as regular chat message
    if (!message.startsWith('/')) {
        return false;
    }

    // Get user info from socket
    const userId = socket.user.id;

    // Check if user has admin role
    const [userRows] = await pool.promise().query(
        'SELECT role FROM users WHERE user_id = ?',
        [userId]
    );

    if (!userRows.length || userRows[0].role !== 'ADMIN') {
        socket.emit('error', { message: 'You do not have permission to use commands' });
        return true; // Command was attempted but rejected
    }

    // Split command and arguments
    const args = message.slice(1).split(' ');
    const command = args[0].toLowerCase();

    try {
        switch (command) {
            case 'add':
                if (args.length !== 3) {
                    socket.emit('error', { message: 'Usage: /add USERID AMOUNT' });
                    return true;
                }

                const targetUserId = args[1];
                const amount = parseFloat(args[2]);

                // Validate amount
                if (isNaN(amount) || amount <= 0) {
                    socket.emit('error', { message: 'Amount must be a positive number' });
                    return true;
                }

                // Update user balance in database
                const [updateResult] = await pool.promise().query(
                    'UPDATE users SET balance = balance + ?, balance_last_update = NOW() WHERE user_id = ?',
                    [amount, targetUserId]
                );
                
                if (updateResult.affectedRows === 0) {
                    socket.emit('error', { message: 'User not found' });
                    return true;
                }
                
                const [targetUser] = await pool.promise().query(
                    'SELECT user_id, balance FROM users WHERE user_id = ?',
                    [targetUserId]
                );

                if (targetUser.length > 0) {
                    // Emit balance update to specific user if they're online
                    const targetSocketId = socket.connectedUsers.get(parseInt(targetUserId));
                    if (targetSocketId) {
                        socket.io.to(targetSocketId).emit('balance_update', {
                            balance: targetUser[0].balance
                        });
                    }
                }

                // Notify admin that command was successful
                socket.emit('commandResponse', {
                    message: `Successfully added ${amount} to user ${targetUserId}'s balance`
                });
                break;

            default:
                socket.emit('error', { message: 'Unknown command' });
        }
    } catch (error) {
        console.error('Command error:', error);
        socket.emit('error', { message: 'An error occurred while executing the command' });
    }

    return true; // Command was handled
};

/**
 * Initialize chat socket handlers
 * @param {Object} io - Socket.IO instance
 * @param {Map} connectedUsers - Map of connected users
 */
module.exports = function(io, connectedUsers) {
    io.on('connection', (socket) => {
        console.log('User connected to chat:', socket.user.id);
        connectedUsers.set(socket.user.id, socket.id);
        
        // Pass io and connectedUsers to socket for command handling
        socket.io = io;
        socket.connectedUsers = connectedUsers;

        // Load message history
        const loadMessages = `
            SELECT m.*, u.username, u.profile_pic 
            FROM messages m 
            JOIN users u ON m.user_id = u.user_id 
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        
        pool.query(loadMessages, (err, results) => {
            if (err) {
                console.error('Error loading messages:', err);
                return;
            }
            socket.emit('load_messages', results.reverse());
        });

        // Handle new messages
        socket.on('send_message', async (messageData) => {
            const userId = socket.user.id;
            const message = messageData.message.trim();
            if (!message) return;

            try {
                // Handle potential commands first
                const wasCommand = await handleCommands(socket, message, pool);
                
                // If it wasn't a command, proceed with normal message handling
                if (!wasCommand) {
                    // Save message to database
                    const sql = 'INSERT INTO messages (user_id, message) VALUES (?, ?)';
                    pool.query(sql, [userId, message], (err, result) => {
                        if (err) {
                            console.error('Error saving message:', err);
                            return;
                        }

                        // Get the saved message with user info
                        const getMessageSql = `
                            SELECT m.*, u.username, u.profile_pic 
                            FROM messages m 
                            JOIN users u ON m.user_id = u.user_id 
                            WHERE m.message_id = ?
                        `;
                        
                        pool.query(getMessageSql, [result.insertId], (err, results) => {
                            if (err || results.length === 0) {
                                console.error('Error retrieving saved message:', err);
                                return;
                            }

                            const savedMessage = results[0];
                            io.emit('new_message', savedMessage);
                        });
                    });
                }
            } catch (error) {
                console.error('Message handling error:', error);
                socket.emit('error', { message: 'An error occurred while processing your message' });
            }
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(socket.user.id);
            console.log('User disconnected from chat:', socket.user.id);
        });
    });
};