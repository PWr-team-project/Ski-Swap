const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const { auth } = require('../middleware/auth');
const {
  getCurrentStatus,
  getStatusHistory,
  changeBookingStatus,
  getStateRequirements
} = require('../utils/bookingStateManager');

/**
 * GET /api/bookings/:id/status/current
 * Get current status of a booking
 */
router.get('/:id/status/current', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user authorization (renter or owner)
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    const currentStatus = await getCurrentStatus(req.params.id);
    const userType = isRenter ? 'renter' : 'owner';
    const requirements = getStateRequirements(currentStatus, userType);

    res.json({
      bookingId: req.params.id,
      currentStatus,
      userType,
      requirements
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/bookings/:id/status/history
 * Get full status history of a booking
 */
router.get('/:id/status/history', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user authorization
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    const history = await getStatusHistory(req.params.id);

    res.json({
      bookingId: req.params.id,
      history
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/status/transition
 * Transition booking to a new status
 * Body: { newStatus: 'ACCEPTED', notes: 'optional notes' }
 */
router.post('/:id/status/transition', auth, async (req, res) => {
  try {
    const { newStatus, notes } = req.body;

    if (!newStatus) {
      return res.status(400).json({ message: 'newStatus is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Determine user type
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.listing_id.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    const actor = isRenter ? 'renter' : 'owner';

    // Attempt state change
    const result = await changeBookingStatus(
      req.params.id,
      newStatus,
      actor,
      req.userId,
      notes
    );

    if (!result.success) {
      return res.status(400).json({
        message: 'Status transition failed',
        error: result.error
      });
    }

    res.json({
      message: 'Status updated successfully',
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error transitioning status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/accept
 * Owner accepts a booking request (PENDING -> ACCEPTED)
 */
router.post('/:id/actions/accept', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify owner
    if (booking.listing_id.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the owner can accept bookings' });
    }

    const result = await changeBookingStatus(
      req.params.id,
      'ACCEPTED',
      'owner',
      req.userId,
      'Owner accepted booking request'
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Booking accepted successfully',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/decline
 * Owner declines a booking request (PENDING -> DECLINED)
 */
router.post('/:id/actions/decline', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify owner
    if (booking.listing_id.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the owner can decline bookings' });
    }

    const result = await changeBookingStatus(
      req.params.id,
      'DECLINED',
      'owner',
      req.userId,
      reason || 'Owner declined booking request'
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Booking declined',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error declining booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/cancel
 * Cancel a booking (from PENDING or ACCEPTED states)
 */
router.post('/:id/actions/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization (renter or owner)
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.listing_id.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    const actor = isRenter ? 'renter' : 'owner';

    const result = await changeBookingStatus(
      req.params.id,
      'CANCELLED',
      actor,
      req.userId,
      reason || `Booking cancelled by ${actor}`
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Booking cancelled successfully',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/confirm-pickup
 * Renter confirms pickup (PICKUP -> IN_PROGRESS)
 * Requires photos to be uploaded first
 */
router.post('/:id/actions/confirm-pickup', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify renter
    if (booking.renter_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the renter can confirm pickup' });
    }

    const result = await changeBookingStatus(
      req.params.id,
      'IN_PROGRESS',
      'renter',
      req.userId,
      'Renter confirmed equipment pickup'
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Pickup confirmed successfully',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/confirm-return
 * Renter confirms return (RETURN -> VERIFY)
 * Requires photos to be uploaded first
 */
router.post('/:id/actions/confirm-return', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify renter
    if (booking.renter_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the renter can confirm return' });
    }

    const result = await changeBookingStatus(
      req.params.id,
      'VERIFY',
      'renter',
      req.userId,
      'Renter confirmed equipment return'
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Return confirmed successfully. Waiting for owner verification.',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error confirming return:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/verify-complete
 * Owner verifies equipment is returned in good condition (VERIFY -> COMPLETED)
 */
router.post('/:id/actions/verify-complete', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify owner
    if (booking.listing_id.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the owner can verify equipment condition' });
    }

    const result = await changeBookingStatus(
      req.params.id,
      'COMPLETED',
      'owner',
      req.userId,
      'Owner verified equipment condition - everything OK'
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Equipment verified. Booking completed!',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error verifying completion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/dispute
 * Owner opens a dispute (VERIFY -> DISPUTED)
 */
router.post('/:id/actions/dispute', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Dispute reason is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify owner
    if (booking.listing_id.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the owner can open disputes' });
    }

    const result = await changeBookingStatus(
      req.params.id,
      'DISPUTED',
      'owner',
      req.userId,
      `Dispute opened: ${reason}`
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Dispute opened. Support team will be notified.',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error opening dispute:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/bookings/:id/actions/mark-reviewed
 * Mark booking as reviewed after user submits review (COMPLETED -> REVIEWED)
 */
router.post('/:id/actions/mark-reviewed', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization (renter or owner)
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.listing_id.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const actor = isRenter ? 'renter' : 'owner';

    const result = await changeBookingStatus(
      req.params.id,
      'REVIEWED',
      actor,
      req.userId,
      `Review submitted by ${actor}`
    );

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Review recorded',
      statusEntry: result.statusEntry
    });
  } catch (error) {
    console.error('Error marking as reviewed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
