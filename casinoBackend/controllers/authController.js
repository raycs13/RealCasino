// Authentication controllers
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { pool, resetPool } = require('../config/db');
const { sendPasswordResetEmail } = require('../config/mailer');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Handle user registration
 */
const register = (req, res) => {
    const { email, username, psw } = req.body;
    const errors = [];

    // Validate inputs
    if (!validator.isEmail(email)) {
        errors.push({ error: 'Nem valós email' });
    }

    if (validator.isEmpty(username)) {
        errors.push({ error: 'Töltsd ki a nevet ' });
    }

    if (!validator.isLength(psw, { min: 6 })) {
        errors.push({ error: 'A jelszónak minimum 6 karakterből kell állnia' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    // Hash password
    const salt = 10;
    bcrypt.hash(psw, salt, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba a sózáskor' });
        }

        // Insert user into database
        const sql = 'INSERT INTO users (user_id, email, username, password, role, balance, balance_last_update, register_date, profile_pic) VALUES (NULL, ?, ?, ?, "member", 0, NOW(), NOW(), "default.png")';
        pool.query(sql, [email, username, hash], (err2, result) => {
            if (err2) {
                console.log(err2);
                return res.status(500).json({ error: 'Az email már foglalt' });
            }

            res.status(201).json({ message: 'Sikeres regisztráció' });
        });
    });
};

/**
 * Handle user login
 */
const login = (req, res) => {
    const { email, psw } = req.body;
    const errors = [];

    // Validate inputs
    if (!validator.isEmail(email)) {
        errors.push({ error: 'Add meg az email címet' });
    }

    if (validator.isEmpty(psw)) {
        errors.push({ error: 'Add meg a jelszót' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    // Check if user exists
    const sql = 'SELECT * FROM users WHERE email LIKE ?';
    pool.query(sql, [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'A felhasználó nem található' });
        }

        // Verify password
        const user = result[0];
        bcrypt.compare(psw, user.password, (err, isMatch) => {
            if (isMatch) {
                // Create JWT token
                const token = jwt.sign(
                    {
                        id: user.user_id
                    },
                    JWT_SECRET,
                    {
                        expiresIn: '1y'
                    }
                );
                
                // Set cookie
                res.cookie('auth_token', token, {
                    httpOnly: false,
                    secure: false,
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 3600000 * 24 * 31 * 12 // 1 year
                });
                
                return res.status(200).json({ message: 'Sikeres bejelentkezés' });
            } else {
                return res.status(401).json({ error: 'Rossz a jelszó' });
            }
        });
    });
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        // Check if user exists
        const [users] = await resetPool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { id: users[0].user_id, purpose: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token
        await resetPool.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE user_id = ?',
            [resetToken, users[0].user_id]
        );

        // Send email
        await sendPasswordResetEmail(email, resetToken);
        
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to process password reset' });
    }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if token is valid in database
        const [users] = await resetPool.query(
            'SELECT user_id FROM users WHERE user_id = ? AND reset_token = ? AND reset_token_expires > NOW()',
            [decoded.id, token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and reset token
        await resetPool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?',
            [hashedPassword, decoded.id]
        );

        res.json({ message: 'Password successfully reset' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            error: error.message === 'Invalid or expired reset token' 
                ? error.message 
                : 'Failed to reset password' 
        });
    }
};

/**
 * Check if user is authenticated
 */
const checkAuth = (req, res) => {
    res.json({ 
        message: 'Authentication successful',
        user: req.user,
        cookies: req.cookies 
    });
};
const logout = (req, res) => {
    try {
        // Clear the auth cookie
        res.clearCookie('auth_token', {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });
        
        return res.status(200).json({ message: 'Sikeres kijelentkezés' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Hiba történt a kijelentkezés során' });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    checkAuth,
    logout
};