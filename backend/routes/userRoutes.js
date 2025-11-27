const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Location = require('../models/Location');
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

// Get current user profile with location data
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('location_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        profile_description: user.profile_description,
        profile_photo: user.profile_photo,
        background_photo: user.background_photo,
        user_type: user.user_type,
        oauth_provider: user.oauth_provider,
        NIP_number: user.NIP_number,
        website_address: user.website_address,
        location: user.location_id || null
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update profile route (with photo uploads - profile and background)
router.put('/profile', auth, upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'background_photo', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);

    const {
      first_name,
      last_name,
      phone_number,
      profile_description,
      location_country,
      location_state,
      location_city,
      location_postcode,
      location_street,
      location_street_number,
      location_latitude,
      location_longitude,
      upgrade_to_company,
      NIP_number,
      website_address,
      remove_profile_photo,
      remove_background_photo
    } = req.body;
    const userId = req.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

    // Update basic fields
    if (first_name) user.first_name = cleanAndCapitalizeName(first_name);
    if (last_name) user.last_name = cleanAndCapitalizeName(last_name);
    if (phone_number !== undefined) user.phone_number = phone_number || null;
    if (profile_description !== undefined) user.profile_description = profile_description || null;

    // Handle location data - validate field lengths
    const hasLocationData = location_country || location_city || location_state || location_street || location_street_number || location_postcode || location_latitude !== undefined || location_longitude !== undefined;

    if (hasLocationData) {
      // Validate field lengths
      if (location_street && location_street.length > 35) {
        return res.status(400).json({ message: 'Street name must not exceed 35 characters' });
      }
      if (location_street_number && location_street_number.length > 5) {
        return res.status(400).json({ message: 'Street number must not exceed 5 characters' });
      }
      if (location_city && location_city.length > 20) {
        return res.status(400).json({ message: 'City name must not exceed 20 characters' });
      }
      if (location_postcode && location_postcode.length > 7) {
        return res.status(400).json({ message: 'Postcode must not exceed 7 characters' });
      }
      if (location_state && location_state.length > 35) {
        return res.status(400).json({ message: 'State/Province must not exceed 35 characters' });
      }
      if (location_country && location_country.length > 20) {
        return res.status(400).json({ message: 'Country name must not exceed 20 characters' });
      }

      // Validate latitude and longitude
      if (location_latitude !== undefined) {
        const lat = parseFloat(location_latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return res.status(400).json({ message: 'Latitude must be a number between -90 and 90' });
        }
      }
      if (location_longitude !== undefined) {
        const lng = parseFloat(location_longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return res.status(400).json({ message: 'Longitude must be a number between -180 and 180' });
        }
      }

      if (user.location_id) {
        // Update existing location
        const location = await Location.findById(user.location_id);
        if (location) {
          if (location_country !== undefined) location.country = location_country;
          if (location_state !== undefined) location.state = location_state || null;
          if (location_city !== undefined) location.city = location_city;
          if (location_postcode !== undefined) location.postcode = location_postcode || null;
          if (location_street !== undefined) location.street = location_street || null;
          if (location_street_number !== undefined) location.street_number = location_street_number || null;
          if (location_latitude !== undefined) location.latitude = parseFloat(location_latitude);
          if (location_longitude !== undefined) location.longitude = parseFloat(location_longitude);
          await location.save();
        }
      } else if (location_country && location_city && location_latitude !== undefined && location_longitude !== undefined) {
        // Create new location (require country, city, latitude, and longitude)
        const location = new Location({
          country: location_country,
          state: location_state || null,
          city: location_city,
          postcode: location_postcode || null,
          street: location_street || null,
          street_number: location_street_number || null,
          latitude: parseFloat(location_latitude),
          longitude: parseFloat(location_longitude)
        });
        await location.save();
        user.location_id = location._id;
      }
    }

    // Handle company upgrade (irreversible)
    if (upgrade_to_company === 'true' && user.user_type !== 'company') {
      user.user_type = 'company';

      // Set company fields if provided during upgrade
      if (NIP_number) user.NIP_number = NIP_number;
      if (website_address) user.website_address = website_address;
    }

    // Company fields are immutable once set (can only be set during upgrade)
    // Existing company accounts cannot change NIP or website after initial setup

    // Handle profile photo removal
    if (remove_profile_photo === 'true' && user.profile_photo) {
      const oldPhotoPath = path.join(__dirname, '..', user.profile_photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      user.profile_photo = null;
    }

    // Handle background photo removal
    if (remove_background_photo === 'true' && user.background_photo) {
      const oldPhotoPath = path.join(__dirname, '..', user.background_photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      user.background_photo = null;
    }

    // Handle profile photo upload
    if (req.files && req.files.profile_photo) {
      const profilePhoto = req.files.profile_photo[0];
      // Delete old photo if it exists
      if (user.profile_photo) {
        const oldPhotoPath = path.join(__dirname, '..', user.profile_photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      user.profile_photo = `/uploads/profiles/${profilePhoto.filename}`;
    }

    // Handle background photo upload
    if (req.files && req.files.background_photo) {
      const backgroundPhoto = req.files.background_photo[0];
      // Delete old photo if it exists
      if (user.background_photo) {
        const oldPhotoPath = path.join(__dirname, '..', user.background_photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      user.background_photo = `/uploads/profiles/${backgroundPhoto.filename}`;
    }

    await user.save();

    // Fetch the updated location to return
    const updatedUser = await User.findById(userId).populate('location_id');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone_number: updatedUser.phone_number,
        profile_description: updatedUser.profile_description,
        profile_photo: updatedUser.profile_photo,
        background_photo: updatedUser.background_photo,
        user_type: updatedUser.user_type,
        oauth_provider: updatedUser.oauth_provider,
        NIP_number: updatedUser.NIP_number,
        website_address: updatedUser.website_address,
        location: updatedUser.location_id || null
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update', error: error.message });
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

    // Delete background photo if it exists
    if (user.background_photo) {
      const photoPath = path.join(__dirname, '..', user.background_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Delete location if it exists
    if (user.location_id) {
      await Location.findByIdAndDelete(user.location_id);
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

// Get public user profile by ID or nickname (NO AUTH REQUIRED - PUBLIC ROUTE)
router.get('/public/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const Listing = require('../models/Listing');
    const Review = require('../models/Review');
    const Booking = require('../models/Booking');

    // Try to find user by ID first, then by nickname
    let user;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier).populate('location_id');
    }
    if (!user) {
      user = await User.findOne({ nickname: identifier }).populate('location_id');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get active listings count
    const activeListings = await Listing.find({
      owner_id: user._id,
      available: true
    }).populate('category_id').populate('location_id');

    // Get reviews where this user is the owner (reviews of their listings)
    const reviews = await Review.find({
      owner_id: user._id,
      review_type: 'renter_to_owner'
    })
      .populate('renter_id', 'first_name last_name profile_photo')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate rental statistics
    // Rentals FROM others (as renter)
    const rentalsFromOthers = await Booking.countDocuments({ renter_id: user._id });

    // Rentals TO others (as owner) - count bookings for user's listings
    const userListings = await Listing.find({ owner_id: user._id });
    const listingIds = userListings.map(listing => listing._id);
    const rentalsToOthers = await Booking.countDocuments({
      listing_id: { $in: listingIds }
    });

    // Format response
    res.json({
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        nickname: user.nickname,
        profile_photo: user.profile_photo,
        background_photo: user.background_photo,
        profile_description: user.profile_description,
        user_type: user.user_type,
        id_verified: user.id_verified,
        rating_avg: user.rating_avg,
        response_rate: user.reponse_rate,
        response_time: user.reponse_time,
        NIP_number: user.user_type === 'company' ? user.NIP_number : null,
        website_address: user.user_type === 'company' ? user.website_address : null,
        location: user.location_id || null,
        createdAt: user.createdAt
      },
      statistics: {
        rentalsFromOthers,
        rentalsToOthers,
        activeListingsCount: activeListings.length
      },
      reviews: reviews.map(review => ({
        id: review._id,
        reviewer: {
          name: `${review.renter_id.first_name} ${review.renter_id.last_name}`,
          profile_photo: review.renter_id.profile_photo
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })),
      activeListings: activeListings.map(listing => ({
        id: listing._id,
        title: listing.title,
        photos: listing.photos,
        daily_rate: listing.daily_rate,
        category: listing.category_id?.name || 'Unknown',
        location: listing.location_id ? {
          city: listing.location_id.city,
          country: listing.location_id.country
        } : null
      }))
    });
  } catch (error) {
    console.error('Public profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching public profile' });
  }
});

module.exports = router;
