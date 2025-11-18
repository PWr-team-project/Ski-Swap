const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');

// Get all users with search, filter, and sort
router.get('/users', adminAuth, async (req, res) => {
  try {
    const {
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      verified,
      blocked,
      userType
    } = req.query;

    // Build query object
    const query = {};

    // Search functionality - searches across multiple fields
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { email: searchRegex },
        { nickname: searchRegex },
        { first_name: searchRegex },
        { last_name: searchRegex }
      ];
    }

    // Filter by verification status
    if (verified !== undefined) {
      query.id_verified = verified === 'true';
    }

    // Filter by blocked status
    if (blocked !== undefined) {
      query.blocked_flag = blocked === 'true';
    }

    // Filter by user type
    if (userType && userType !== 'all') {
      query.user_type = userType;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password_hash -googleId') // Exclude sensitive fields
      .populate('location_id', 'city country') // Include location info
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get detailed information for a specific user
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user with all related data
    const user = await User.findById(userId)
      .select('-password_hash -googleId') // Exclude sensitive fields
      .populate('location_id')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // You can add more related data here if needed
    // For example: listings, bookings, messages, etc.

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

// Get user statistics
router.get('/users/:id/stats', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Import models only when needed to avoid circular dependencies
    const Listing = require('../models/Listing');
    const Booking = require('../models/Booking');

    // Get user statistics
    const [
      totalListings,
      activeListings,
      totalBookingsMade,
      totalBookingsReceived
    ] = await Promise.all([
      Listing.countDocuments({ user_id: userId }),
      Listing.countDocuments({ user_id: userId, status: 'active' }),
      Booking.countDocuments({ renter_id: userId }),
      Booking.countDocuments({ owner_id: userId })
    ]);

    res.json({
      totalListings,
      activeListings,
      totalBookingsMade,
      totalBookingsReceived
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

module.exports = router;
