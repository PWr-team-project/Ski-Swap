const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Listing = require('../models/Listing');
const { auth } = require('../middleware/auth');
const { hasDateConflict } = require('../utils/availabilityCalculator');

console.log('🔵 bookingRoutes.js is being loaded...');

// Get user's rentals (equipment I'm renting from others)
router.get('/renting', auth, async (req, res) => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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

    // Get reviews (renter_to_owner reviews that the renter has submitted)
    const bookingIds = bookings.map(b => b._id);
    const reviews = await Review.find({
      booking_id: { $in: bookingIds },
      review_type: 'renter_to_owner'
    });
    const reviewMap = {};
    reviews.forEach(r => {
      reviewMap[r.booking_id.toString()] = true;
    });

    // Categorize bookings based on status
    // Active: PICKUP, PICKUP_OWNER, PICKUP_RENTER, IN_PROGRESS, RETURN, RETURN_OWNER, RETURN_RENTER
    // Upcoming: ACCEPTED
    // Pending: PENDING
    // History: COMPLETED, REVIEWED, CANCELLED, DECLINED, DISPUTED, DISPUTE_RESOLVED
    const categorized = {
      pending: [],
      active: [],
      upcoming: [],
      history: []
    };

    const activeStatuses = ['PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];
    const historyStatuses = ['COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'];

    bookings.forEach(booking => {
      const currentStatus = booking.current_status;
      const hasReview = reviewMap[booking._id.toString()] || false;

      const bookingData = {
        ...booking.toObject(),
        status: currentStatus,
        hasReview: hasReview
      };

      // Calculate days remaining
      const daysRemaining = Math.ceil((new Date(booking.end_date) - now) / (1000 * 60 * 60 * 24));
      const pickupDate = new Date(booking.start_date);

      if (currentStatus === 'PENDING') {
        categorized.pending.push(bookingData);
      } else if (activeStatuses.includes(currentStatus)) {
        bookingData.daysRemaining = daysRemaining;
        categorized.active.push(bookingData);
      } else if (currentStatus === 'ACCEPTED') {
        // ACCEPTED goes to active if pickup is within 3 days (and in the future), otherwise upcoming
        if (pickupDate > threeDaysFromNow) {
          categorized.upcoming.push(bookingData);
        } else {
          bookingData.daysRemaining = daysRemaining;
          categorized.active.push(bookingData);
        }
      } else if (historyStatuses.includes(currentStatus)) {
        categorized.history.push(bookingData);
      }
    });

    // Calculate stats
    const stats = {
      pendingRequests: categorized.pending.length,
      activeRentals: categorized.active.length,
      upcomingRentals: categorized.upcoming.length,
      completedRentals: categorized.history.length
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
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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

    // Get payments
    const bookingIds = bookings.map(b => b._id);
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

    // Categorize bookings based on status
    // Active: ACCEPTED (pickup <= 3 days), PICKUP, PICKUP_OWNER, PICKUP_RENTER, IN_PROGRESS, RETURN, RETURN_OWNER, RETURN_RENTER
    // Upcoming: ACCEPTED (pickup > 3 days)
    // Pending: PENDING
    // History: COMPLETED, REVIEWED, CANCELLED, DECLINED, DISPUTED, DISPUTE_RESOLVED
    const categorized = {
      active: [],
      upcoming: [],
      pending: [],
      history: []
    };

    const activeStatuses = ['PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];
    const historyStatuses = ['COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'];

    bookings.forEach(booking => {
      const currentStatus = booking.current_status;
      const payment = paymentMap[booking._id.toString()];
      const review = reviewMap[booking._id.toString()];

      const bookingData = {
        ...booking.toObject(),
        status: currentStatus,
        payment: payment,
        renterReview: review
      };

      // Calculate days remaining
      const daysRemaining = Math.ceil((new Date(booking.end_date) - now) / (1000 * 60 * 60 * 24));
      const pickupDate = new Date(booking.start_date);

      if (currentStatus === 'PENDING') {
        categorized.pending.push(bookingData);
      } else if (activeStatuses.includes(currentStatus)) {
        bookingData.daysRemaining = daysRemaining;
        categorized.active.push(bookingData);
      } else if (currentStatus === 'ACCEPTED') {
        // ACCEPTED goes to active if pickup is within 3 days, otherwise upcoming
        if (pickupDate > threeDaysFromNow) {
          categorized.upcoming.push(bookingData);
        } else {
          bookingData.daysRemaining = daysRemaining;
          categorized.active.push(bookingData);
        }
      } else if (historyStatuses.includes(currentStatus)) {
        categorized.history.push(bookingData);
      }
    });

    // Calculate total earnings from completed bookings
    let totalEarnings = 0;
    categorized.history.forEach(booking => {
      if (['COMPLETED', 'REVIEWED'].includes(booking.status)) {
        totalEarnings += booking.total_price || 0;
      }
    });

    // Calculate average rating from reviews
    let averageRating = 0;
    const reviewRatings = reviews.filter(r => r.rating).map(r => r.rating);
    if (reviewRatings.length > 0) {
      averageRating = reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewRatings.length;
    }

    // Calculate stats
    const stats = {
      pendingRequests: categorized.pending.length,
      activeBookings: categorized.active.length,
      upcomingBookings: categorized.upcoming.length,
      completedBookings: categorized.history.length,
      totalEarnings: totalEarnings.toFixed(2),
      averageRating: averageRating
    };

    res.json({ stats, bookings: categorized });
  } catch (error) {
    console.error('Error fetching lending data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============= PAYMENT ROUTES (Must be before /:id route) =============
// Process payment for a booking
router.post('/:id/payment/process', auth, async (req, res) => {
  console.log('Payment process route hit!');
  try {
    const { includeInsurance, insuranceAmount, totalAmount } = req.body;

    // Find the booking (don't populate to avoid save issues)
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the renter
    if (booking.renter_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    // Check if payment is already confirmed
    if (booking.payment_confirmed) {
      return res.status(400).json({ message: 'Payment already confirmed for this booking' });
    }

    // Create payment record
    const payment = new Payment({
      booking_id: booking._id,
      payer_id: req.userId,
      amount: totalAmount || booking.total_price,
      insurance_amount: includeInsurance ? (insuranceAmount || 0) : 0,
      skiswap_fee: booking.skiswap_fee || 0,
      currency: 'EUR',
      payment_status: 'completed'
    });

    await payment.save();

    // Update booking with payment info using findByIdAndUpdate to avoid validation issues
    await Booking.findByIdAndUpdate(
      booking._id,
      {
        $set: {
          payment_confirmed: true,
          payment_id: payment._id,
          insurance_flag: includeInsurance || false
        }
      },
      { new: true }
    );

    // Return success
    res.json({
      message: 'Payment processed successfully',
      payment: payment
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      details: error.toString()
    });
  }
});

// Reject payment for a booking
router.post('/:id/payment/reject', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the renter
    if (booking.renter_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to reject payment for this booking' });
    }

    // Create a failed payment record
    const payment = new Payment({
      booking_id: booking._id,
      payer_id: req.userId,
      amount: booking.total_price,
      insurance_amount: 0,
      skiswap_fee: booking.skiswap_fee || 0,
      currency: 'EUR',
      payment_status: 'failed',
      refund_reason: 'Payment rejected by user'
    });

    await payment.save();

    res.json({
      message: 'Payment rejected',
      payment: payment
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
          { path: 'owner_id', select: 'nickname first_name last_name profile_photo email rating_avg' }
        ]
      })
      .populate('renter_id', 'nickname first_name last_name profile_photo email rating_avg');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (booking.renter_id._id.toString() !== req.userId &&
        booking.listing_id.owner_id._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    // Return booking with status from Booking.current_status (fast query)
    const bookingData = {
      ...booking.toObject(),
      status: booking.current_status
    };

    res.json(bookingData);
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

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Validate dates
    if (startDate >= endDate) {
      return res.status(400).json({
        message: 'End date must be after start date'
      });
    }

    // Validate rental period is not longer than 1 month (30 days)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return res.status(400).json({
        message: 'Rental period cannot exceed 30 days'
      });
    }

    // Validate start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return res.status(400).json({
        message: 'Start date cannot be in the past'
      });
    }

    // Get listing and check if dates are available
    const listing = await Listing.findById(listing_id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is trying to book their own listing
    if (listing.owner_id.toString() === req.userId) {
      return res.status(400).json({
        message: 'You cannot book your own listing'
      });
    }

    // Check for date conflicts with existing active bookings
    const conflictExists = await hasDateConflict(listing_id, startDate, endDate);

    if (conflictExists) {
      return res.status(400).json({
        message: 'Selected dates are not available. Please choose different dates.'
      });
    }

    // Create booking
    const booking = new Booking({
      renter_id: req.userId,
      owner_id: listing.owner_id,
      listing_id,
      start_date: startDate,
      end_date: endDate,
      insurance_flag: insurance_flag || false,
      total_price: parseFloat(total_price)
    });

    await booking.save();

    // Create initial BookingStatus entry
    const initialStatus = new BookingStatus({
      booking_id: booking._id,
      status: 'PENDING',
      changed_by: 'renter',
      changed_by_user_id: req.userId,
      notes: 'Booking created'
    });
    await initialStatus.save();

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
      booking,
      status: initialStatus
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

// Get booking confirmation data by ID
router.get('/:id/confirmation', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'listing',
        populate: [
          { path: 'category_id', select: 'name' },
          { path: 'location_id' },
          { path: 'owner_id', select: 'nickname first_name last_name profile_photo email' }
        ]
      })
      .populate({ path: 'renter_id', select: 'nickname first_name last_name profile_photo email'} )
      .populate('payment_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking confirmation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

console.log('✅ bookingRoutes.js loaded successfully - all routes registered');
module.exports = router;
