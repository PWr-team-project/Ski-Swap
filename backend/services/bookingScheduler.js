const cron = require('node-cron');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const {
  getCurrentStatus,
  changeBookingStatus,
  isPaymentCompleted,
  hasPhotosUploaded
} = require('../utils/bookingStateManager');

/**
 * Check and transition bookings based on automated rules
 * Runs every hour
 */
async function checkAndTransitionBookings() {
  try {
    console.log('[BookingScheduler] Running automated state transitions...');

    const now = new Date();

    // Get all active bookings (not in terminal states)
    const activeBookings = await Booking.find({
      current_status: {
        $nin: ['COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTE_RESOLVED']
      }
    });

    let transitionCount = 0;

    for (const booking of activeBookings) {
      const currentStatus = await getCurrentStatus(booking._id);

      // Rule 0: PENDING -> CANCELLED if no response from owner after 24 hours
      if (currentStatus === 'PENDING') {
        // Find when PENDING status was set
        const pendingStatus = await BookingStatus.findOne({
          booking_id: booking._id,
          status: 'PENDING'
        }).sort({ createdAt: -1 });

        if (pendingStatus) {
          const twentyFourHoursAfterPending = new Date(pendingStatus.createdAt);
          twentyFourHoursAfterPending.setHours(twentyFourHoursAfterPending.getHours() + 24);

          if (now >= twentyFourHoursAfterPending) {
            const result = await changeBookingStatus(
              booking._id,
              'CANCELLED',
              'system',
              null,
              'No response from owner'
            );

            if (result.success) {
              console.log(`[BookingScheduler] Booking ${booking._id}: PENDING -> CANCELLED (no owner response)`);
              transitionCount++;
            }
          }
        }
      }

      // Rule 1: ACCEPTED -> PICKUP on start_date
      if (currentStatus === 'ACCEPTED' && now >= booking.start_date) {
        const paymentCompleted = await isPaymentCompleted(booking._id);

        if (paymentCompleted) {
          const result = await changeBookingStatus(
            booking._id,
            'PICKUP',
            'system',
            null,
            'Automatic transition to PICKUP on start date'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: ACCEPTED -> PICKUP`);
            transitionCount++;
          }
        } else {
          // No payment after start date - cancel booking
          const result = await changeBookingStatus(
            booking._id,
            'CANCELLED',
            'system',
            null,
            'Booking cancelled - payment not received by start date'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: ACCEPTED -> CANCELLED (no payment)`);
            transitionCount++;
          }
        }
      }

      // Rule 2: PICKUP -> IN_PROGRESS if photos not uploaded 1 day after start_date
      if (currentStatus === 'PICKUP') {
        const oneDayAfterStart = new Date(booking.start_date);
        oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);

        if (now >= oneDayAfterStart) {
          const result = await changeBookingStatus(
            booking._id,
            'IN_PROGRESS',
            'system',
            null,
            'Automatic transition to IN_PROGRESS - pickup photos not uploaded within 24 hours'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: PICKUP -> IN_PROGRESS (auto)`);
            transitionCount++;
          }
        }
      }

      // Rule 3: IN_PROGRESS -> RETURN 1 days before end_date
      if (currentStatus === 'IN_PROGRESS') {
        const oneDayBeforeEnd = new Date(booking.end_date);
        oneDayBeforeEnd.setDate(oneDayBeforeEnd.getDate() - 1);

        if (now >= oneDayBeforeEnd) {
          const result = await changeBookingStatus(
            booking._id,
            'RETURN',
            'system',
            null,
            'Automatic transition to RETURN - 1 day before end date'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: IN_PROGRESS -> RETURN (auto)`);
            transitionCount++;
          }
        }
      }

      // Rule 4: RETURN -> RETURN_OWNER if return not confirmed 1 day after end_date
      if (currentStatus === 'RETURN') {
        const oneDayAfterEnd = new Date(booking.end_date);
        oneDayAfterEnd.setDate(oneDayAfterEnd.getDate() + 1);

        if (now >= oneDayAfterEnd) {
          const result = await changeBookingStatus(
            booking._id,
            'RETURN_OWNER',
            'system',
            null,
            'Automatic transition to RETURN_OWNER - return not confirmed within 24 hours of return date'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: RETURN -> RETURN_OWNER (auto)`);
            transitionCount++;
          }
        }
      }

      // Rule 5: PICKUP_OWNER/PICKUP_RENTER -> IN_PROGRESS if not confirmed 1 day after start_date
      if (currentStatus === 'PICKUP_OWNER' || currentStatus === 'PICKUP_RENTER') {
        const oneDayAfterStart = new Date(booking.start_date);
        oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);

        if (now >= oneDayAfterStart) {
          const result = await changeBookingStatus(
            booking._id,
            'IN_PROGRESS',
            'system',
            null,
            'Automatic transition to IN_PROGRESS - pickup not fully confirmed within 24 hours'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: ${currentStatus} -> IN_PROGRESS (auto)`);
            transitionCount++;
          }
        }
      }

      // Rule 6: RETURN_OWNER/RETURN_RENTER -> COMPLETED if owner doesn't respond within 2 days from return date
      if (currentStatus === 'RETURN_OWNER' || currentStatus === 'RETURN_RENTER') {
        // Find when this return status was set
        const twoDaysAfterReturn = new Date(booking.end_date);
        twoDaysAfterReturn.setDate(twoDaysAfterReturn.getDate() + 2);

        if (now >= twoDaysAfterReturn) {
          const result = await changeBookingStatus(
            booking._id,
            'COMPLETED',
            'system',
            null,
            'Automatic completion - owner did not verify equipment within 2 days'
          );

          if (result.success) {
            console.log(`[BookingScheduler] Booking ${booking._id}: ${currentStatus} -> COMPLETED (auto)`);
            transitionCount++;
          }
        }
      }
    }
    console.log(`[BookingScheduler] Completed. ${transitionCount} booking(s) transitioned.`);
  } catch (error) {
    console.error('[BookingScheduler] Error during automated transitions:', error);
  }
}

/**
 * Start the booking scheduler
 * Runs every hour at minute 0
 */
function startScheduler() {
  console.log('[BookingScheduler] Starting automated booking state scheduler...');

  // Run every hour
  cron.schedule('0 * * * *', async () => {
    await checkAndTransitionBookings();
  });

  // Also run once on startup (after 30 seconds to allow DB to connect)
  setTimeout(async () => {
    console.log('[BookingScheduler] Running initial check...');
    await checkAndTransitionBookings();
  }, 30000);

  console.log('[BookingScheduler] Scheduler started successfully. Will run every hour.');
}

module.exports = {
  startScheduler,
  checkAndTransitionBookings // Export for manual testing
};
