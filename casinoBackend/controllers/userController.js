// User controllers for admin functions
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

/**
 * Get all users
 */
const getAllUsers = (req, res) => {
    pool.query('SELECT user_id, username, password, email, role, balance, balance_last_update, profile_pic FROM users', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Adatbazis hiba!' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nem talalhato!' });
        }

        return res.status(200).json(result);
    });
};

/**
 * Get a single user by ID
 */
const getUserById = (req, res) => {
    const id = req.params.id;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Hibas azonosito!' });
    }
    
    pool.query('SELECT user_id, username, password, email, role, balance, balance_last_update, profile_pic FROM users WHERE user_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Adatbazis hiba!,' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nem talalhato!' });
        }
        return res.status(200).json(result);
    });
};

/**
 * Update a user
 */
const updateUser = (req, res) => {
    const userId = parseInt(req.params.id);
    const { username, password, email, role, balance } = req.body;
    const salt = 10;

    // Function to handle the update after password processing
    const performUpdate = (hashedPassword) => {
        pool.query(
            'UPDATE users SET username = ?, password = ?, email = ?, role = ?, balance = ?, balance_last_update = CURRENT_TIMESTAMP() WHERE user_id = ?',
            [username, hashedPassword, email, role, parseFloat(balance), userId],
            (err, result) => {
                if (err) {
                    console.error('Update error:', err);
                    return res.status(500).json({ error: 'Adatbazis hiba!' });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Felhasznalo nem talalhato!' });
                }
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'Felhasznalo sikeresen frissitve!' 
                });
            }
        );
    };
    
    // Handle password hashing if provided
    if (password) {
        // Basic validation - add more as needed
        if (password.length < 6) {
            return res.status(400).json({ error: 'A jelszónak min 6 karakterből kell állnia' });
        }
        
        // Hash the password
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                console.error('Hashing error:', err);
                return res.status(500).json({ error: 'Hiba a sózáskor' });
            }
            performUpdate(hash);
        });
    } else {
        // If no password provided, only update other fields
        pool.query(
            'UPDATE users SET username = ?, email = ?, role = ?, balance = ?, balance_last_update = CURRENT_TIMESTAMP() WHERE user_id = ?',
            [username, email, role, parseFloat(balance), userId],
            (err, result) => {
                if (err) {
                    console.error('Update error:', err);
                    return res.status(500).json({ error: 'Adatbazis hiba!' });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Felhasznalo nem talalhato!' });
                }
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'Felhasznalo sikeresen frissitve!' 
                });
            }
        );
    }
};

/**
 * Batch update multiple users
 */
const batchUpdateUsers = (req, res) => {
    const users = req.body;
    
    if (!Array.isArray(users)) {
        return res.status(400).json({ error: 'Ervenytelen adatok!' });
    }
    
    const promises = users.map(user => {
        return new Promise((resolve, reject) => {
            if (!user.user_id) {
                return resolve();
            }
            
            pool.query(
                'UPDATE users SET username = ?, password = ?, email = ?, role = ?, balance = ?, balance_last_update = CURRENT_TIMESTAMP() WHERE user_id = ?',
                [
                    user.username || '',
                    user.password || '',
                    user.email || '',
                    user.role || 'user',
                    parseFloat(user.balance || 0),
                    parseInt(user.user_id)
                ],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
    });
    
    Promise.all(promises)
        .then(() => {
            return res.status(200).json({ 
                success: true, 
                message: 'Felhasznalok sikeresen frissitve!' 
            });
        })
        .catch(err => {
            console.error('Batch update error:', err);
            return res.status(500).json({ error: 'Adatbazis hiba!' });
        });
};

/**
 * Delete a user
 */
const deleteUser = (req, res) => {
    const userId = parseInt(req.params.id);
    
    pool.query(
        'DELETE FROM users WHERE user_id = ?',
        [userId],
        (err, result) => {
            if (err) {
                console.error('Delete error:', err);
                return res.status(500).json({ error: 'Adatbazis hiba!' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Felhasznalo nem talalhato!' });
            }
            
            return res.status(200).json({ 
                success: true, 
                message: 'Felhasznalo sikeresen torolve!' 
            });
        }
    );
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    batchUpdateUsers,
    deleteUser
};