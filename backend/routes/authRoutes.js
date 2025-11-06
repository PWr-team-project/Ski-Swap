const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Create uploads directory for profile photos
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|gif|webp/i;
    const allowedMimeTypes = /image\/(jpeg|jpg|png|gif|webp)/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Register route
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('nickname').trim().notEmpty().withMessage('Nickname is required'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, nickname, first_name, last_name, user_type, phone_number } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Check if nickname is taken
      const existingNickname = await User.findOne({ nickname });
      if (existingNickname) {
        return res.status(400).json({ message: 'This nickname is already taken' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({
        email: email.toLowerCase(),
        password_hash,
        nickname,
        first_name,
        last_name,
        user_type: user_type || 'individual',
        phone_number: phone_number || null
      });

      await newUser.save();

      // Create JWT token
      const token = jwt.sign(
        {
          userId: newUser._id,
          email: newUser.email,
          nickname: newUser.nickname
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          nickname: newUser.nickname,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          user_type: newUser.user_type,
          profile_photo: newUser.profile_photo
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check if user is blocked
      if (user.blocked_flag) {
        return res.status(403).json({ message: 'This account has been blocked' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Create JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          nickname: user.nickname
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type,
          profile_photo: user.profile_photo,
          admin_flag: user.admin_flag
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Verify token route (to check if user is authenticated)
router.get('/verify', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided', authenticated: false });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId).select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'User not found', authenticated: false });
    }

    if (user.blocked_flag) {
      return res.status(403).json({ message: 'Account is blocked', authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        profile_photo: user.profile_photo,
        admin_flag: user.admin_flag
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token', authenticated: false });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', authenticated: false });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error', authenticated: false });
  }
});

// Update profile route (with photo upload)
router.put('/profile', auth, upload.single('profile_photo'), async (req, res) => {
  try {
    const { first_name, last_name, phone_number, address } = req.body;
    const userId = req.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (phone_number !== undefined) user.phone_number = phone_number || null;
    if (address !== undefined) user.address = address || null;

    // Handle profile photo upload
    if (req.file) {
      // Delete old photo if it exists
      if (user.profile_photo) {
        const oldPhotoPath = path.join(__dirname, '..', user.profile_photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      // Store relative path for serving via static middleware
      user.profile_photo = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        address: user.address,
        profile_photo: user.profile_photo,
        user_type: user.user_type,
        oauth_provider: user.oauth_provider
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Change password route
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.userId;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user is OAuth user
      if (user.oauth_provider === 'google') {
        return res.status(400).json({ message: 'Cannot change password for Google accounts' });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return res.status(400).json({ message: 'New password must be different from current password' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(newPassword, salt);

      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Server error during password change' });
    }
  }
);

// Delete account route
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If not OAuth user, verify password
    if (user.oauth_provider !== 'google') {
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
    }

    // Delete profile photo if it exists
    if (user.profile_photo) {
      const photoPath = path.join(__dirname, '..', user.profile_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // TODO: Delete related data (listings, messages, etc.)
    // This should be handled based on your data model
    // For example:
    // await Listing.deleteMany({ user_id: userId });
    // await Message.deleteMany({ sender_id: userId });
    // await Conversation.deleteMany({ participants: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error during account deletion' });
  }
});

module.exports = router;
