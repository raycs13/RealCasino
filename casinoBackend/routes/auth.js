// Authentication routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    register,
    login,
    forgotPassword,
    resetPassword,
    checkAuth,
    logout
} = require('../controllers/authController');

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login', login);

// Request password reset
router.post('/forgot-password', forgotPassword);

// Reset password with token
router.post('/reset-password', resetPassword);

// Check authentication status
router.get('/check-auth', authenticateToken, checkAuth);
router.post('/logout', logout);

module.exports = router;