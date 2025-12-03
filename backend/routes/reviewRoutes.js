const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Create a review for a booking
router.post('/bookings/:bookingId/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.bookingId;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Get booking with populated fields
    const booking = await Booking.findById(bookingId)
      .populate('listing_id')
      .populate('renter_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is in COMPLETED status
    if (booking.current_status !== 'COMPLETED') {
      return res.status(400).json({
        message: 'Reviews can only be submitted for completed bookings',
        currentStatus: booking.current_status
      });
    }

    // Check if user is the renter
    if (booking.renter_id._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the renter can submit a review' });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({
      booking_id: bookingId,
      review_type: 'renter_to_owner'
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    // Get owner from listing
    const ownerId = booking.listing_id.owner_id;

    // Create the review
    const review = new Review({
      booking_id: bookingId,
      renter_id: req.userId,
      owner_id: ownerId,
      rating: rating,
      comment: comment || '',
      review_type: 'renter_to_owner',
      listing_id: booking.listing_id._id
    });

    await review.save();

    // Update booking status to REVIEWED
    booking.current_status = 'REVIEWED';
    await booking.save();

    // Update owner's rating statistics
    await updateUserRating(ownerId);

    res.status(201).json({
      message: 'Review submitted successfully',
      review: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews for a specific booking
router.get('/bookings/:bookingId/reviews', auth, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    // Get booking to verify access
    const booking = await Booking.findById(bookingId).populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized (renter or owner)
    if (booking.renter_id.toString() !== req.userId &&
        booking.listing_id.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view reviews for this booking' });
    }

    // Get reviews for this booking
    const reviews = await Review.find({ booking_id: bookingId })
      .populate('renter_id', 'nickname first_name last_name profile_photo')
      .populate('owner_id', 'nickname first_name last_name profile_photo');

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews for a specific user (as owner)
router.get('/users/:userId/reviews', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get all reviews where user is the owner (received reviews)
    const reviews = await Review.find({
      owner_id: userId,
      review_type: 'renter_to_owner'
    })
      .populate('renter_id', 'nickname first_name last_name profile_photo')
      .populate('booking_id')
      .populate('listing_id', 'title photos')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to update user rating statistics
async function updateUserRating(userId) {
  try {
    // Get all reviews for this user as owner
    const reviews = await Review.find({
      owner_id: userId,
      review_type: 'renter_to_owner'
    });

    if (reviews.length === 0) {
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update user's rating_avg
    await User.findByIdAndUpdate(userId, {
      rating_avg: averageRating
    });

    console.log(`Updated rating for user ${userId}: ${averageRating.toFixed(2)} (${reviews.length} reviews)`);
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
}

console.log('✅ reviewRoutes.js loaded successfully - all routes registered');
module.exports = router;
