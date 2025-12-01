const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');

/**
 * Statuses that block availability for a listing
 * These are all statuses where the equipment is potentially unavailable
 */
const BLOCKING_STATUSES = [
  'PENDING',      // Requested but not yet accepted - blocks dates to prevent double booking
  'ACCEPTED',     // Accepted, waiting for pickup
  'PICKUP',       // Pickup in progress
  'PICKUP_OWNER', // Owner confirmed pickup
  'PICKUP_RENTER',// Renter confirmed pickup
  'IN_PROGRESS',  // Currently rented out
  'RETURN',       // Return in progress
  'RETURN_OWNER', // Owner confirmed return
  'RETURN_RENTER' // Renter confirmed return
];

/**
 * Statuses that DON'T block availability
 */
const NON_BLOCKING_STATUSES = [
  'DECLINED',
  'CANCELLED',
  'DISPUTED',
  'DISPUTE_RESOLVED',
  'COMPLETED',
  'REVIEWED'
];

/**
 * Get all blocked date ranges for a listing
 * Based on active bookings (not cancelled, declined, completed, etc.)
 *
 * @param {String} listingId - The listing ID
 * @returns {Promise<Array>} Array of { start_date, end_date } objects
 */
async function getBlockedDatesForListing(listingId) {
  try {
    // Find all bookings for this listing
    const allBookings = await Booking.find({
      listing_id: listingId
    }).select('_id start_date end_date current_status');

    console.log(`[Availability] Listing ${listingId}: Found ${allBookings.length} total bookings`);

    const blockedRanges = [];

    for (const booking of allBookings) {
      let effectiveStatus = booking.current_status;

      console.log(`[Availability] Booking ${booking._id}: current_status = ${effectiveStatus || 'NULL'}`);

      // If current_status is not set, try to get it from BookingStatus table
      if (!effectiveStatus) {
        const latestStatus = await BookingStatus.findOne({
          booking_id: booking._id
        }).sort({ createdAt: -1 }).select('status');

        effectiveStatus = latestStatus ? latestStatus.status : 'PENDING';
        console.log(`[Availability] Booking ${booking._id}: Fetched from BookingStatus = ${effectiveStatus}`);
      }

      // Only include if status blocks availability
      if (BLOCKING_STATUSES.includes(effectiveStatus)) {
        blockedRanges.push({
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: effectiveStatus
        });
        console.log(`[Availability] Booking ${booking._id}: BLOCKING (${effectiveStatus}) - ${booking.start_date} to ${booking.end_date}`);
      } else {
        console.log(`[Availability] Booking ${booking._id}: NOT blocking (${effectiveStatus})`);
      }
    }

    console.log(`[Availability] Listing ${listingId}: Returning ${blockedRanges.length} blocked date ranges`);
    return blockedRanges;
  } catch (error) {
    console.error('Error calculating blocked dates:', error);
    throw error;
  }
}

/**
 * Check if a date range conflicts with existing bookings
 *
 * @param {String} listingId - The listing ID
 * @param {Date} startDate - Proposed start date
 * @param {Date} endDate - Proposed end date
 * @param {String} excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns {Promise<Boolean>} True if there's a conflict
 */
async function hasDateConflict(listingId, startDate, endDate, excludeBookingId = null) {
  try {
    // Get all bookings for this listing that overlap with the requested dates
    const query = {
      listing_id: listingId,
      // Check for date overlap with INCLUSIVE end dates
      // A conflict exists if: (start1 <= end2) AND (end1 >= start2)
      // This ensures drop-off days are also blocked (can't be pickup days)
      start_date: { $lte: endDate },
      end_date: { $gte: startDate }
    };

    // Exclude a specific booking if provided (useful for updates)
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const potentialConflicts = await Booking.find(query).select('_id current_status');

    // Check each booking to see if its status blocks availability
    for (const booking of potentialConflicts) {
      let effectiveStatus = booking.current_status;

      // If current_status is not set, try to get it from BookingStatus table
      if (!effectiveStatus) {
        const latestStatus = await BookingStatus.findOne({
          booking_id: booking._id
        }).sort({ createdAt: -1 }).select('status');

        effectiveStatus = latestStatus ? latestStatus.status : 'PENDING';
      }

      // If this booking has a blocking status, there's a conflict
      if (BLOCKING_STATUSES.includes(effectiveStatus)) {
        return true;
      }
    }

    // No conflicts found
    return false;
  } catch (error) {
    console.error('Error checking date conflict:', error);
    throw error;
  }
}

/**
 * Get available date ranges for a listing within a time period
 * This is more complex and can be used for advanced calendar features
 *
 * @param {String} listingId - The listing ID
 * @param {Date} periodStart - Start of period to check
 * @param {Date} periodEnd - End of period to check
 * @returns {Promise<Array>} Array of available date ranges
 */
async function getAvailableDateRanges(listingId, periodStart, periodEnd) {
  try {
    const blockedRanges = await getBlockedDatesForListing(listingId);

    // Sort blocked ranges by start date
    blockedRanges.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    const availableRanges = [];
    let currentStart = new Date(periodStart);

    for (const blocked of blockedRanges) {
      const blockedStart = new Date(blocked.start_date);
      const blockedEnd = new Date(blocked.end_date);

      // If there's a gap before this blocked range, it's available
      if (currentStart < blockedStart) {
        availableRanges.push({
          start_date: currentStart,
          end_date: blockedStart
        });
      }

      // Move current start to after this blocked range
      if (blockedEnd > currentStart) {
        currentStart = blockedEnd;
      }
    }

    // Add final available range if there's space after last blocked range
    if (currentStart < periodEnd) {
      availableRanges.push({
        start_date: currentStart,
        end_date: periodEnd
      });
    }

    return availableRanges;
  } catch (error) {
    console.error('Error calculating available date ranges:', error);
    throw error;
  }
}

module.exports = {
  getBlockedDatesForListing,
  hasDateConflict,
  getAvailableDateRanges,
  BLOCKING_STATUSES
};
