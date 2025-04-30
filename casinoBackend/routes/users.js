// User routes for admin functions
const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUser,
    batchUpdateUsers,
    deleteUser
} = require('../controllers/userController');
const { logout } = require('../controllers/authController');

// Get all users
router.get('/', getAllUsers);

// Get a single user by ID
router.get('/:id', getUserById);

// Update a user
router.put('/:id', updateUser);

// Batch update multiple users
router.put('/', batchUpdateUsers);

// Delete a user
router.delete('/:id', deleteUser);

module.exports = router;