// Payment routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createPaymentIntent, updateBalance } = require('../controllers/paymentController');

// Create payment intent
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);

// Update balance after successful payment
router.post('/update-balance', authenticateToken, updateBalance);

module.exports = router;