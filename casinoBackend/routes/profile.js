// Profile routes
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { authenticateToken } = require('../middleware/auth');
const {
    getProfilePic,
    getUserRole,
    updateUsername,
    updateEmail,
    updatePassword,
    updateProfilePic,
    getBalance
} = require('../controllers/profileController');

// Get user's profile picture
router.get('/user/profilePic', authenticateToken, getProfilePic);

// Get user's role
router.get('/user/role', authenticateToken, getUserRole);

// Update username
router.put('/editUsername', authenticateToken, updateUsername);

// Update email
router.put('/editEmail', authenticateToken, updateEmail);

// Update password
router.put('/editProfilePsw', authenticateToken, updatePassword);

// Update profile picture
router.put('/editProfilePic', authenticateToken, upload.single('profile_pic'), updateProfilePic);

// Get user balance
router.get('/balance', authenticateToken, getBalance);

module.exports = router;