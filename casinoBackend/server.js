// Main application entry point
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '../casinoFrontend')));

// CORS configuration
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://192.168.10.24:5500',
        'http://192.168.10.24:3000',
        'http://localhost:5500',
        'http://localhost:5501',
        'http://localhost:3000',
        `http://${HOSTNAME}:3000`
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
}));

// Create HTTP server
const server = http.createServer(app);

// Import and initialize socket.io
const initSocketIO = require('./socket');
const io = initSocketIO(server);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payments');
const gameRoutes = require('./routes/game');
const dailyRewardsRouter = require('./routes/daily-reward');
const { hostname } = require('os');


// Use routes
app.use('/api', authRoutes);
app.use('/users', userRoutes);
app.use('/api', profileRoutes);
app.use('/api', paymentRoutes);
app.use('/api', gameRoutes);
app.use('/api', dailyRewardsRouter);


// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});

module.exports = { app, server };