// Profile controllers
const bcrypt = require('bcrypt');
const validator = require('validator');
const { pool } = require('../config/db');

/**
 * Get user's profile picture
 */
const getProfilePic = (req, res) => {
    const userId = req.user.id;
    
    pool.query('SELECT profile_pic FROM users WHERE user_id = ?', [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(result[0]);
    });
};

/**
 * Get user's role
 */
const getUserRole = (req, res) => {
    const userId = req.user.id;
    
    pool.query('SELECT role FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ role: results[0].role });
    });
};

/**
 * Update username
 */
const updateUsername = (req, res) => {
    const name = req.body.username;
    const userid = req.user.id;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Username cannot be empty' });
    }
    
    const sql = 'UPDATE users SET username = ? WHERE user_id = ?';
    
    pool.query(sql, [name, userid], (err, result) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No user found with this ID' });
        }
        
        return res.status(200).json({ message: 'Név frissítve' });
    });
};

/**
 * Update email
 */
const updateEmail = (req, res) => {
    const email = req.body.email;
    const userid = req.user.id;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const sql = 'UPDATE users SET email = ? WHERE user_id = ?';
    
    pool.query(sql, [email, userid], (err, result) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No user found with this ID' });
        }
        
        return res.status(200).json({ message: 'Email frissítve' });
    });
};

/**
 * Update password
 */
const updatePassword = (req, res) => {
    const psw = req.body.psw;
    const userid = req.user.id;

    if (psw === '' || !validator.isLength(psw, { min: 6 })) {
        return res.status(400).json({ error: 'A jelszónak min 6 karakterből kell állnia' });
    }

    const salt = 10;
    bcrypt.hash(psw, salt, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba a sózáskor' });
        }

        const sql = 'UPDATE users SET password = ? WHERE user_id = ?';

        pool.query(sql, [hash, userid], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Jelszó frissítve ' });
        });
    });
};

/**
 * Update profile picture
 */
const updateProfilePic = (req, res) => {
    const userid = req.user.id;
    const profile_pic = req.file ? req.file.filename : null;

    if (!profile_pic) {
        return res.status(400).json({ error: 'No profile picture uploaded' });
    }

    const sql = 'UPDATE users SET profile_pic = ? WHERE user_id = ?';

    pool.query(sql, [profile_pic, userid], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(200).json({ message: 'Profilkép frissítve ' });
    });
};

/**
 * Get user balance
 */
const getBalance = (req, res) => {
    const userId = req.user.id;
    
    const sql = 'SELECT balance FROM users WHERE user_id = ?';
    pool.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ balance: result[0].balance });
    });
};

module.exports = {
    getProfilePic,
    getUserRole,
    updateUsername,
    updateEmail,
    updatePassword,
    updateProfilePic,
    getBalance
};