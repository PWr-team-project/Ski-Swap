const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Listing = require('../models/Listing');
const { auth } = require('../middleware/auth');

// Get user's rentals (equipment I'm renting from others)
router.get('/renting', auth, async (req, res) => {
  try {
    const now = new Date();

    // Get all bookings where user is the renter
    const bookings = await Booking.find({ renter_id: req.userId })
      .populate({
        path: 'listing_id',
        populate: [
          { path: 'category_id', select: 'name' },
          { path: 'location_id' },
          { path: 'owner_id', select: 'nickname first_name last_name profile_photo email' }
        ]
      })
      .sort({ start_date: -1 });

    // Get booking statuses
    const bookingIds = bookings.map(b => b._id);
    const statuses = await BookingStatus.find({ booking_id: { $in: bookingIds } });
    const statusMap = {};
    statuses.forEach(s => {
      statusMap[s.booking_id.toString()] = s;
    });

    // Get reviews
    const reviews = await Review.find({
      booking_id: { $in: bookingIds },
      review_type: 'owner_to_renter'
    });
    const reviewMap = {};
    reviews.forEach(r => {
      reviewMap[r.booking_id.toString()] = r;
    });

    // Categorize bookings
    const categorized = {
      active: [],
      upcoming: [],
      history: []
    };

    let completedCount = 0;
    let totalRatingSum = 0;
    let ratingCount = 0;

    bookings.forEach(booking => {
      const status = statusMap[booking._id.toString()];
      const review = reviewMap[booking._id.toString()];

      const bookingData = {
        ...booking.toObject(),
        status: status?.status || 'pending',
        bookingStatus: status,
        ownerReview: review
      };

      // Calculate days remaining
      const daysRemaining = Math.ceil((new Date(booking.end_date) - now) / (1000 * 60 * 60 * 24));

      if (status?.status === 'ongoing' && new Date(booking.end_date) >= now) {
        bookingData.daysRemaining = daysRemaining;
        categorized.active.push(bookingData);
      } else if ((status?.status === 'confirmed' || status?.status === 'pending') && new Date(booking.start_date) > now) {
        categorized.upcoming.push(bookingData);
      } else if (status?.status === 'completed' || new Date(booking.end_date) < now) {
        categorized.history.push(bookingData);
        completedCount++;
        if (review?.rating) {
          totalRatingSum += review.rating;
          ratingCount++;
        }
      }
    });

    // Calculate stats
    const stats = {
      completedRentals: completedCount,
      activeRentals: categorized.active.length,
      upcomingRentals: categorized.upcoming.length,
      averageRating: ratingCount > 0 ? (totalRatingSum / ratingCount).toFixed(1) : 0
    };

    res.json({ stats, bookings: categorized });
  } catch (error) {
    console.error('Error fetching renting data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's lending (equipment others rent from me)
router.get('/lending', auth, async (req, res) => {
  try {
    const now = new Date();

    // Get all listings owned by user
    const myListings = await Listing.find({ owner_id: req.userId });
    const listingIds = myListings.map(l => l._id);

    // Get all bookings for my listings
    const bookings = await Booking.find({ listing_id: { $in: listingIds } })
      .populate({
        path: 'listing_id',
        populate: [
          { path: 'category_id', select: 'name' },
          { path: 'location_id' }
        ]
      })
      .populate('renter_id', 'nickname first_name last_name profile_photo email')
      .sort({ start_date: -1 });

    // Get booking statuses
    const bookingIds = bookings.map(b => b._id);
    const statuses = await BookingStatus.find({ booking_id: { $in: bookingIds } });
    const statusMap = {};
    statuses.forEach(s => {
      statusMap[s.booking_id.toString()] = s;
    });

    // Get payments
    const payments = await Payment.find({ booking_id: { $in: bookingIds } });
    const paymentMap = {};
    payments.forEach(p => {
      paymentMap[p.booking_id.toString()] = p;
    });

    // Get reviews
    const reviews = await Review.find({
      booking_id: { $in: bookingIds },
      review_type: 'renter_to_owner'
    });
    const reviewMap = {};
    reviews.forEach(r => {
      reviewMap[r.booking_id.toString()] = r;
    });

    // Categorize bookings
    const categorized = {
      active: [],
      upcoming: [],
      pending: [],
      history: []
    };

    let completedCount = 0;
    let totalEarnings = 0;

    bookings.forEach(booking => {
      const status = statusMap[booking._id.toString()];
      const payment = paymentMap[booking._id.toString()];
      const review = reviewMap[booking._id.toString()];

      const bookingData = {
        ...booking.toObject(),
        status: status?.status || 'pending',
        bookingStatus: status,
        payment: payment,
        renterReview: review
      };

      // Calculate days remaining
      const daysRemaining = Math.ceil((new Date(booking.end_date) - now) / (1000 * 60 * 60 * 24));

      if (status?.status === 'pending') {
        categorized.pending.push(bookingData);
      } else if (status?.status === 'ongoing' && new Date(booking.end_date) >= now) {
        bookingData.daysRemaining = daysRemaining;
        categorized.active.push(bookingData);
      } else if ((status?.status === 'confirmed') && new Date(booking.start_date) > now) {
        categorized.upcoming.push(bookingData);
      } else if (status?.status === 'completed' || new Date(booking.end_date) < now) {
        categorized.history.push(bookingData);
        completedCount++;
        if (payment?.payment_status === 'completed') {
          totalEarnings += payment.amount;
        }
      }
    });

    // Calculate stats
    const stats = {
      totalEarnings: totalEarnings.toFixed(2),
      completedBookings: completedCount,
      activeBookings: categorized.active.length,
      upcomingBookings: categorized.upcoming.length,
      pendingRequests: categorized.pending.length
    };

    res.json({ stats, bookings: categorized });
  } catch (error) {
    console.error('Error fetching lending data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'listing_id',
        populate: [
          { path: 'category_id', select: 'name' },
          { path: 'location_id' },
          { path: 'owner_id', select: 'nickname first_name last_name profile_photo email' }
        ]
      })
      .populate('renter_id', 'nickname first_name last_name profile_photo email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (booking.renter_id._id.toString() !== req.userId &&
        booking.listing_id.owner_id._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
router.post('/create', auth, async (req, res) => {
  try {
    const {
      listing_id,
      start_date,
      end_date,
      insurance_flag,
      total_price
    } = req.body;

    // Validate required fields
    if (!listing_id || !start_date || !end_date || total_price === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: listing_id, start_date, end_date, and total_price are required'
      });
    }

    // Create booking
    const booking = new Booking({
      renter_id: req.userId,
      listing_id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      insurance_flag: insurance_flag || false,
      total_price: parseFloat(total_price)
    });

    await booking.save();

    // Populate the booking before sending response
    await booking.populate({
      path: 'listing_id',
      populate: [
        { path: 'category_id', select: 'name' },
        { path: 'location_id' },
        { path: 'owner_id', select: 'nickname first_name last_name profile_photo email' }
      ]
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a booking
router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the renter
    if (booking.renter_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    const {
      start_date,
      end_date,
      insurance_flag,
      total_price
    } = req.body;

    // Update fields
    if (start_date) booking.start_date = new Date(start_date);
    if (end_date) booking.end_date = new Date(end_date);
    if (insurance_flag !== undefined) booking.insurance_flag = insurance_flag;
    if (total_price !== undefined) booking.total_price = parseFloat(total_price);

    await booking.save();

    await booking.populate({
      path: 'listing_id',
      populate: [
        { path: 'category_id', select: 'name' },
        { path: 'location_id' },
        { path: 'owner_id', select: 'nickname first_name last_name profile_photo email' }
      ]
    });

    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking status (for accepting/declining requests)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const booking = await Booking.findById(req.params.id).populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the owner of the listing
    if (booking.listing_id.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking status' });
    }

    // Find or create booking status
    let bookingStatus = await BookingStatus.findOne({ booking_id: req.params.id });

    if (!bookingStatus) {
      bookingStatus = new BookingStatus({
        booking_id: req.params.id,
        status: status
      });
    } else {
      bookingStatus.status = status;
    }

    await bookingStatus.save();

    res.json({
      message: 'Booking status updated successfully',
      status: bookingStatus
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the renter
    if (booking.renter_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
