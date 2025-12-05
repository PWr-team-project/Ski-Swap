const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

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

      const { email, password, nickname, first_name, last_name, user_type } = req.body;

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

      // Helper function to clean and capitalize names
      const cleanAndCapitalizeName = (name) => {
        if (!name) return name;
        // Remove any numbers and special characters, keep only letters, spaces, hyphens, and apostrophes
        const cleaned = name.replace(/[^a-zA-Z\s\-']/g, '').trim();
        // Capitalize first letter of each word
        return cleaned.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create new user - only basic info during registration
      // Phone number, location, and company details are set via Edit Profile
      const newUser = new User({
        email: email.toLowerCase(),
        password_hash,
        nickname,
        first_name: cleanAndCapitalizeName(first_name),
        last_name: cleanAndCapitalizeName(last_name),
        user_type: user_type || 'individual', // Accept user_type from request, default to individual
        oauth_provider: 'local' // Explicitly set for non-OAuth registrations
      });
      
      const welcomeEmailDetails = {
        to: email,
        nickname: nickname,
        firstName: first_name,
        lastName: last_name,
      };
      
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
      
      // Save user
      await newUser.save();
      
      // Send welcome email
      await axios.post(process.env.API_URL + '/api/email/welcome', welcomeEmailDetails);

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
          admin_flag: user.admin_flag,
          id_verified: user.id_verified
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
        admin_flag: user.admin_flag,
        id_verified: user.id_verified
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

module.exports = router;
