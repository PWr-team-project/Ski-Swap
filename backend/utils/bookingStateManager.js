const BookingStatus = require('../models/BookingStatus');
const BookingPhoto = require('../models/BookingPhoto');
const Payment = require('../models/Payment');

// Define valid state transitions based on user requirements
const STATE_TRANSITIONS = {
  PENDING: {
    renter: ['CANCELLED'],
    owner: ['ACCEPTED', 'DECLINED'],
    system: []
  },
  ACCEPTED: {
    renter: ['CANCELLED'],
    owner: ['CANCELLED'],
    system: ['PICKUP', 'CANCELLED'] // Auto to PICKUP on start_date, CANCEL if no payment
  },
  PICKUP: {
    renter: ['IN_PROGRESS'], // After uploading photos and confirming
    owner: [],
    system: ['IN_PROGRESS'] // Auto if 1 day passed without photos
  },
  IN_PROGRESS: {
    renter: [],
    owner: [],
    system: ['RETURN'] // Auto 2 days before end_date
  },
  RETURN: {
    renter: ['VERIFY'], // After uploading photos and confirming return
    owner: [],
    system: ['VERIFY'] // Auto if 1 day passed after end_date without photos
  },
  VERIFY: {
    renter: [],
    owner: ['COMPLETED', 'DISPUTED'], // Owner confirms or disputes
    system: ['COMPLETED'] // Auto if owner doesn't respond within 3 days
  },
  COMPLETED: {
    renter: ['REVIEWED'], // After submitting review
    owner: ['REVIEWED'], // After submitting review
    system: []
  },
  REVIEWED: {
    renter: [],
    owner: [],
    system: []
  },
  CANCELLED: {
    renter: [],
    owner: [],
    system: []
  },
  DECLINED: {
    renter: [],
    owner: [],
    system: []
  },
  DISPUTED: {
    renter: [],
    owner: [],
    system: ['DISPUTE_RESOLVED'] // Admin resolves
  },
  DISPUTE_RESOLVED: {
    renter: [],
    owner: [],
    system: []
  }
};

/**
 * Get the current (latest) status of a booking
 */
async function getCurrentStatus(bookingId) {
  const latestStatus = await BookingStatus.findOne({ booking_id: bookingId })
    .sort({ createdAt: -1 })
    .limit(1);

  return latestStatus ? latestStatus.status : 'PENDING';
}

/**
 * Get all status history for a booking (ordered by newest first)
 */
async function getStatusHistory(bookingId) {
  return await BookingStatus.find({ booking_id: bookingId })
    .sort({ createdAt: -1 })
    .populate('changed_by_user_id', 'nickname first_name last_name');
}

/**
 * Validate if a state transition is allowed
 */
function isValidTransition(currentStatus, newStatus, actor) {
  if (!STATE_TRANSITIONS[currentStatus]) {
    return { valid: false, reason: 'Invalid current status' };
  }

  const allowedTransitions = STATE_TRANSITIONS[currentStatus][actor];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      reason: `Transition from ${currentStatus} to ${newStatus} not allowed for ${actor}`
    };
  }

  return { valid: true };
}

/**
 * Check if payment is completed for a booking
 */
async function isPaymentCompleted(bookingId) {
  const payment = await Payment.findOne({
    booking_id: bookingId,
    payment_status: 'completed'
  });
  return !!payment;
}

/**
 * Check if photos are uploaded for a specific type
 */
async function hasPhotosUploaded(bookingId, photoType) {
  const photos = await BookingPhoto.find({
    booking_id: bookingId,
    type: photoType
  });
  return photos.length > 0;
}

/**
 * Change booking status with validation
 * @param {ObjectId} bookingId - Booking ID
 * @param {String} newStatus - New status to transition to
 * @param {String} actor - Who is making the change ('renter', 'owner', 'system')
 * @param {ObjectId} userId - User ID making the change (null for system)
 * @param {String} notes - Optional notes about the status change
 */
async function changeBookingStatus(bookingId, newStatus, actor, userId = null, notes = null) {
  try {
    // Get current status
    const currentStatus = await getCurrentStatus(bookingId);

    // Validate transition
    const validation = isValidTransition(currentStatus, newStatus, actor);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Special validation: Can't move to PICKUP without payment
    if (newStatus === 'PICKUP') {
      const paymentCompleted = await isPaymentCompleted(bookingId);
      if (!paymentCompleted) {
        throw new Error('Payment must be completed before pickup');
      }
    }

    // Special validation: Renter can't move to IN_PROGRESS from PICKUP without photos
    if (currentStatus === 'PICKUP' && newStatus === 'IN_PROGRESS' && actor === 'renter') {
      const hasPickupPhotos = await hasPhotosUploaded(bookingId, 'pickup');
      if (!hasPickupPhotos) {
        throw new Error('Pickup photos must be uploaded before confirming pickup');
      }
    }

    // Special validation: Renter can't move to VERIFY from RETURN without photos
    if (currentStatus === 'RETURN' && newStatus === 'VERIFY' && actor === 'renter') {
      const hasReturnPhotos = await hasPhotosUploaded(bookingId, 'return');
      if (!hasReturnPhotos) {
        throw new Error('Return photos must be uploaded before confirming return');
      }
    }

    // Create new status entry
    const newStatusEntry = new BookingStatus({
      booking_id: bookingId,
      status: newStatus,
      changed_by: actor,
      changed_by_user_id: userId,
      notes: notes
    });

    await newStatusEntry.save();

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus: newStatus,
      statusEntry: newStatusEntry
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get UI requirements and available actions for a given state and user type
 */
function getStateRequirements(status, userType) {
  const requirements = {
    PENDING: {
      renter: {
        canCancel: true,
        canPay: true,
        showContactInfo: false,
        message: 'Waiting for owner approval',
        nextAction: 'Wait for owner to accept your request'
      },
      owner: {
        canAccept: true,
        canDecline: true,
        showContactInfo: false,
        showPaymentInfo: true,
        message: 'New booking request',
        nextAction: 'Review and accept or decline the request'
      }
    },
    ACCEPTED: {
      renter: {
        canCancel: true,
        canPay: true,
        showContactInfo: true,
        message: 'Booking accepted by owner',
        nextAction: 'Complete payment to proceed'
      },
      owner: {
        canCancel: true,
        showContactInfo: true,
        showPaymentInfo: true,
        message: 'Booking accepted. Waiting for payment',
        nextAction: 'Wait for renter payment. Equipment will be handed off on pickup date.'
      }
    },
    PICKUP: {
      renter: {
        canUploadPhotos: true,
        canConfirmPickup: true,
        showContactInfo: true,
        photoType: 'pickup',
        message: 'Pickup day!',
        nextAction: 'Upload photos of equipment condition and confirm pickup'
      },
      owner: {
        showContactInfo: true,
        message: 'Equipment pickup day',
        nextAction: 'Hand off equipment to renter'
      }
    },
    IN_PROGRESS: {
      renter: {
        showContactInfo: true,
        showReturnLocation: true,
        message: 'Rental in progress',
        nextAction: 'Enjoy your rental! Return by the end date.'
      },
      owner: {
        showContactInfo: true,
        message: 'Equipment currently rented',
        nextAction: 'Equipment will be returned on the scheduled date'
      }
    },
    RETURN: {
      renter: {
        canUploadPhotos: true,
        canConfirmReturn: true,
        showContactInfo: true,
        showReturnLocation: true,
        photoType: 'return',
        message: 'Return day!',
        nextAction: 'Return equipment, upload photos and confirm return'
      },
      owner: {
        canConfirmReturn: true,
        showContactInfo: true,
        message: 'Equipment return day',
        nextAction: 'Receive equipment from renter'
      }
    },
    VERIFY: {
      renter: {
        message: 'Equipment returned',
        nextAction: 'Waiting for owner to verify equipment condition'
      },
      owner: {
        canConfirmComplete: true,
        canDispute: true,
        message: 'Verify equipment condition',
        nextAction: 'Check the equipment and confirm everything is alright'
      }
    },
    COMPLETED: {
      renter: {
        canReview: true,
        message: 'Rental completed!',
        nextAction: 'Share your experience with a review'
      },
      owner: {
        canReview: true,
        message: 'Rental completed!',
        nextAction: 'Rate your renter'
      }
    },
    REVIEWED: {
      renter: {
        canRentAgain: true,
        message: 'Thanks for your review!',
        nextAction: 'Looking for another rental?'
      },
      owner: {
        message: 'Rental complete',
        nextAction: null
      }
    },
    CANCELLED: {
      renter: {
        message: 'Booking cancelled',
        nextAction: null
      },
      owner: {
        message: 'Booking cancelled',
        nextAction: null
      }
    },
    DECLINED: {
      renter: {
        message: 'Booking request declined',
        nextAction: 'Browse other listings'
      },
      owner: {
        message: 'Booking request declined',
        nextAction: null
      }
    },
    DISPUTED: {
      renter: {
        canContactSupport: true,
        message: 'Dispute opened',
        nextAction: 'Our support team will review this case'
      },
      owner: {
        canContactSupport: true,
        message: 'Dispute opened',
        nextAction: 'Our support team will review this case'
      }
    },
    DISPUTE_RESOLVED: {
      renter: {
        message: 'Dispute resolved',
        nextAction: null
      },
      owner: {
        message: 'Dispute resolved',
        nextAction: null
      }
    }
  };

  return requirements[status]?.[userType] || { message: 'Unknown status', nextAction: null };
}

module.exports = {
  getCurrentStatus,
  getStatusHistory,
  isValidTransition,
  changeBookingStatus,
  isPaymentCompleted,
  hasPhotosUploaded,
  getStateRequirements,
  STATE_TRANSITIONS
};
