const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../services/emailService');

// Generate random 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset - Send code to email
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.status(200).json({
          message: 'If an account with this email exists, a password reset code has been sent.'
        });
      }

      // Check if user registered with OAuth
      if (user.oauth_provider !== 'local') {
        return res.status(400).json({
          message: 'This account uses Google sign-in. Please sign in with Google instead.'
        });
      }

      // Delete any existing reset tokens for this user
      await PasswordResetToken.deleteMany({ userId: user._id });

      // Generate reset code
      const code = generateResetCode();

      // Save reset token
      const resetToken = new PasswordResetToken({
        userId: user._id,
        email: user.email,
        code
      });
      await resetToken.save();

      // Send email
      try {
        await sendPasswordResetEmail(user.email, code, user.first_name);
        console.log(`Password reset code sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Delete the token since email failed
        await PasswordResetToken.deleteOne({ _id: resetToken._id });
        return res.status(500).json({
          message: 'Failed to send reset code. Please try again later.'
        });
      }

      res.status(200).json({
        message: 'Password reset code has been sent to your email.',
        email: user.email // Send back for frontend to display
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// Verify reset code
router.post(
  '/verify-reset-code',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;

      // Find valid token
      const resetToken = await PasswordResetToken.findOne({
        email: email.toLowerCase(),
        code
      });

      if (!resetToken) {
        return res.status(400).json({
          message: 'Invalid or expired code. Please request a new one.'
        });
      }

      // Code is valid
      res.status(200).json({
        message: 'Code verified successfully.',
        email: resetToken.email
      });
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// Reset password with verified code
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code, newPassword } = req.body;

      // Find valid token
      const resetToken = await PasswordResetToken.findOne({
        email: email.toLowerCase(),
        code
      });

      if (!resetToken) {
        return res.status(400).json({
          message: 'Invalid or expired code. Please request a new one.'
        });
      }

      // Find user
      const user = await User.findById(resetToken.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update user password
      user.password_hash = password_hash;
      await user.save();

      // Delete all reset tokens for this user
      await PasswordResetToken.deleteMany({ userId: user._id });

      console.log(`Password reset successful for ${user.email}`);

      res.status(200).json({
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

module.exports = router;
