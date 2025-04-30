// Socket.io configuration
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const initializeChat = require('../socket/chat');
const initializeGame = require('../socket/game');

/**
 * Initialize Socket.IO with the HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} io - Socket.IO instance
 */
module.exports = function(server) {
    const io = new Server(server, {
        cors: {
            origin: [
                'http://127.0.0.1:5500',
                'http://127.0.0.1:5501',
                'http://192.168.10.24:5500',
                'http://192.168.10.24:3000',
                'http://localhost:5500',
                'http://localhost:3000',
                `http://${process.env.HOSTNAME}:3000`
            ],
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        }
    });

    // Socket.IO middleware to authenticate users
    io.use((socket, next) => {
        console.log('Socket middleware - checking auth');
        const token = socket.handshake.auth.token;
        console.log('Received token:', token);
        
        if (!token) {
            console.log('No token provided');
            return next(new Error('Authentication error - no token'));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log('Token verification failed:', err);
                return next(new Error('Authentication error - invalid token'));
            }
            console.log('Token verified, user:', user);
            socket.user = user;
            next();
        });
    });

    // Store connected users
    const connectedUsers = new Map();

    // Initialize socket handlers
    initializeChat(io, connectedUsers);
    initializeGame(io, connectedUsers);

    return io;
};