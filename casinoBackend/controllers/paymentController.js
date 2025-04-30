// Payment controllers
const stripeReq = require('stripe');
const { pool } = require('../config/db');

// Initialize Stripe with secret key
const stripe = stripeReq(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 */
const createPaymentIntent = async (req, res) => {
    const { amount } = req.body;  // Amount should be in cents (e.g., 1000 for $10.00)

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
};

/**
 * Update user balance after successful payment
 */
const updateBalance = (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;  // Amount in cents

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    const sql = 'UPDATE users SET balance = balance + ? WHERE user_id = ?';
    pool.query(sql, [amount, userId], (err, result) => {
        if (err) {
            console.error('Error updating balance:', err);
            return res.status(500).json({ error: 'Failed to update balance' });
        }
        res.json({ message: 'Balance updated successfully' });
    });
};

module.exports = {
    createPaymentIntent,
    updateBalance
};