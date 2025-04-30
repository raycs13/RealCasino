// Email configuration for password reset
const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send a password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Reset token for password reset
 * @returns {Promise}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    const resetLink = `http://34.51.132.126:3000/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h2>Password Reset Request</h2>c
            <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetLink}">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    transporter,
    sendPasswordResetEmail
};