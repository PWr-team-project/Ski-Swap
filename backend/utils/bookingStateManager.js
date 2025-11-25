const BookingStatus = require('../models/BookingStatus');
const BookingPhoto = require('../models/BookingPhoto');
const Payment = require('../models/Payment');
const BookingMessage = require('../models/BookingMessage');

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
    renter: ['PICKUP_RENTER'], // After uploading photos and confirming
    owner: ['PICKUP_OWNER'], // After handing off equipment
    system: ['IN_PROGRESS'] // Auto if start_date passed without photos
  },
  PICKUP_OWNER: {
    renter: ['IN_PROGRESS'], // After uploading photos and confirming
    owner: [],
    system: ['IN_PROGRESS'] // Auto if start_date passed without photos
  },
  PICKUP_RENTER: {
    renter: ['IN_PROGRESS'], // After uploading photos and confirming
    owner: [],
    system: ['IN_PROGRESS'] // Auto if start_date passed without photos
  },
  IN_PROGRESS: {
    renter: [],
    owner: [],
    system: ['RETURN'] // Auto 1 day before end_date
  },
  RETURN: {
    renter: ['RETURN_RENTER'], // After uploading photos and confirming return
    owner: ['RETURN_OWNER'],
    system: ['RETURN_OWNER'] // Auto if end_date passed without photos
  },
  RETURN_OWNER: {
    renter: [],
    owner: ['COMPLETED', 'DISPUTED'], // Owner confirms or disputes
    system: ['COMPLETED'] // Auto if owner doesn't respond within 2 days from return date
  },
  RETURN_RENTER: {
    renter: ['RETURN_OWNER'],
    owner: ['COMPLETED', 'DISPUTED'], // Owner confirms or disputes
    system: ['COMPLETED'] // Auto if owner doesn't respond within 2 days from return date
  },
  COMPLETED: {
    renter: ['REVIEWED'], // After submitting review
    owner: [],
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
 * Create a system message for status changes
 */
async function createSystemMessage(bookingId, newStatus, notes = null) {
  const statusMessages = {
    ACCEPTED: 'Booking has been accepted by the owner.',
    PICKUP: 'Equipment pickup day has arrived. Please coordinate the handoff.',
    PICKUP_OWNER: 'Owner has confirmed the equipment handoff.',
    PICKUP_RENTER: 'Renter has confirmed receiving the equipment.',
    IN_PROGRESS: 'Equipment handoff completed. Rental period is now active.',
    RETURN: 'Equipment return day has arrived. Please coordinate the return.',
    RETURN_OWNER: 'Owner has confirmed receiving the equipment back.',
    RETURN_RENTER: 'Renter has confirmed returning the equipment.',
    COMPLETED: 'Booking has been completed successfully.',
    REVIEWED: 'Renter has submitted a review for this booking.',
    CANCELLED: 'Booking has been cancelled.',
    DECLINED: 'Booking request has been declined by the owner.',
    DISPUTED: 'A dispute has been opened for this booking. Support team will review.',
    DISPUTE_RESOLVED: 'Dispute has been resolved by the support team.'
  };

  let content = statusMessages[newStatus] || `Booking status changed to ${newStatus}`;

  if (notes) {
    content += ` Note: ${notes}`;
  }

  const systemMessage = new BookingMessage({
    booking_id: bookingId,
    sender_id: null, // null for system messages
    message_type: 'system_status',
    content: content,
    status_reference: newStatus,
    is_read: false
  });

  await systemMessage.save();
  return systemMessage;
}

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

    // Special validation: Renter can't move to PICKUP_RENTER from PICKUP without photos
    if (currentStatus === 'PICKUP' && newStatus === 'PICKUP_RENTER' && actor === 'renter') {
      const hasPickupPhotos = await hasPhotosUploaded(bookingId, 'pickup');
      if (!hasPickupPhotos) {
        throw new Error('Pickup photos must be uploaded before confirming pickup');
      }
    }
    // Special validation: Renter can't move to IN_PROGRESS from PICKUP_OWNER without photos
    if (currentStatus === 'PICKUP_OWNER' && newStatus === 'IN_PROGRESS' && actor === 'renter') {
      const hasPickupPhotos = await hasPhotosUploaded(bookingId, 'pickup');
      if (!hasPickupPhotos) {
        throw new Error('Pickup photos must be uploaded before confirming pickup');
      }
    }

    // Special validation: Renter can't move to RETURN_RENTER from RETURN without photos
    if (currentStatus === 'RETURN' && newStatus === 'RETURN_RENTER' && actor === 'renter') {
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

    // Create system message for chat (only for states where chat should be visible)
    const chatVisibleStates = ['ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS',
                                'RETURN', 'RETURN_OWNER', 'RETURN_RENTER', 'COMPLETED', 'REVIEWED',
                                'DISPUTED', 'DISPUTE_RESOLVED'];

    if (chatVisibleStates.includes(newStatus)) {
      await createSystemMessage(bookingId, newStatus, notes);
    }

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
        showLocation: false,
        message: 'Waiting for owner approval',
        nextAction: 'Wait for owner to accept your request'
      },
      owner: {
        canAccept: true,
        canDecline: true,
        showContactInfo: false,
        showLocation: false,
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
        showLocation: true,
        message: 'Booking accepted by owner',
        nextAction: 'Complete payment to proceed'
      },
      owner: {
        canCancel: true,
        showContactInfo: true,
        showLocation: true,
        showPaymentInfo: true,
        message: 'Booking accepted. Waiting for payment',
        nextAction: 'Wait for renter payment. Equipment will be handed off on pickup date.'
      }
    },
    PICKUP: {
      renter: {
        canUploadPhotos: true,
        canConfirmHandoff: true,
        showContactInfo: true,
        showLocation: true,
        photoType: 'pickup',
        message: 'Pickup day!',
        nextAction: 'Upload photos of equipment condition and confirm handoff'
      },
      owner: {
        canConfirmHandoff: true,
        showContactInfo: true,
        showLocation: true,
        message: 'Equipment pickup day',
        nextAction: 'Hand off equipment to renter and confirm'
      }
    },
    PICKUP_OWNER: {
      renter: {
        canUploadPhotos: true,
        canConfirmHandoff: true,
        showContactInfo: true,
        showLocation: true,
        photoType: 'pickup',
        message: 'Owner confirmed handoff',
        nextAction: 'Upload photos and confirm you received the equipment'
      },
      owner: {
        showContactInfo: true,
        showLocation: true,
        message: 'Waiting for renter confirmation',
        nextAction: 'Renter needs to confirm they received the equipment'
      }
    },
    PICKUP_RENTER: {
      renter: {
        showContactInfo: true,
        showLocation: true,
        message: 'You confirmed pickup',
        nextAction: 'Waiting for owner to confirm handoff'
      },
      owner: {
        canConfirmHandoff: true,
        showContactInfo: true,
        showLocation: true,
        message: 'Renter confirmed pickup',
        nextAction: 'Confirm you handed off the equipment'
      }
    },
    IN_PROGRESS: {
      renter: {
        showContactInfo: true,
        showLocation: true,
        message: 'Rental in progress',
        nextAction: 'Enjoy your rental! Return by the end date.'
      },
      owner: {
        showContactInfo: true,
        showLocation: true,
        message: 'Equipment currently rented',
        nextAction: 'Equipment will be returned on the scheduled date'
      }
    },
    RETURN: {
      renter: {
        canUploadPhotos: true,
        canConfirmReturn: true,
        showContactInfo: true,
        showLocation: true,
        photoType: 'return',
        message: 'Return day!',
        nextAction: 'Return equipment, upload photos and confirm return'
      },
      owner: {
        canConfirmReturn: true,
        showContactInfo: true,
        showLocation: true,
        message: 'Equipment return day',
        nextAction: 'Receive equipment from renter and confirm'
      }
    },
    RETURN_RENTER: {
      renter: {
        showContactInfo: true,
        showLocation: false,
        message: 'You confirmed return',
        nextAction: 'Waiting for owner to verify equipment'
      },
      owner: {
        canUploadPhotos: true,
        canConfirmComplete: true,
        canDispute: true,
        showContactInfo: true,
        showLocation: true,
        photoType: 'return',
        message: 'Renter confirmed return',
        nextAction: 'Check equipment and confirm everything is OK or report issue'
      }
    },
    RETURN_OWNER: {
      renter: {
        canUploadPhotos: true,
        canConfirmReturn: true,
        showContactInfo: true,
        showLocation: true,
        photoType: 'return',
        message: 'Owner confirmed return',
        nextAction: 'Confirm you returned the equipment'
      },
      owner: {
        canUploadPhotos: true,
        canConfirmComplete: true,
        canDispute: true,
        showContactInfo: true,
        showLocation: true,
        photoType: 'return',
        message: 'You confirmed receiving equipment',
        nextAction: 'Verify equipment condition - Everything OK or Something Wrong?'
      }
    },
    COMPLETED: {
      renter: {
        canReview: true,
        showContactInfo: true,
        showLocation: false,
        message: 'Rental completed!',
        nextAction: 'Share your experience with a review'
      },
      owner: {
        showContactInfo: true,
        showLocation: false,
        message: 'Rental completed!',
        nextAction: null
      }
    },
    REVIEWED: {
      renter: {
        canRentAgain: true,
        showContactInfo: true,
        showLocation: false,
        message: 'Thanks for your review!',
        nextAction: 'Looking for another rental?'
      },
      owner: {
        canShowReview: true,
        showContactInfo: true,
        showLocation: false,
        message: 'Rental complete',
        nextAction: null
      }
    },
    CANCELLED: {
      renter: {
        canRentAgain: true,
        showContactInfo: true,
        showLocation: false,
        message: 'Booking cancelled',
        nextAction: null
      },
      owner: {
        showContactInfo: true,
        showLocation: false,
        message: 'Booking cancelled',
        nextAction: null
      }
    },
    DECLINED: {
      renter: {
        showContactInfo: true,
        showLocation: false,
        message: 'Booking request declined',
        nextAction: 'Browse other listings'
      },
      owner: {
        showContactInfo: true,
        showLocation: false,
        message: 'Booking request declined',
        nextAction: null
      }
    },
    DISPUTED: {
      renter: {
        canContactSupport: true,
        showContactInfo: false,
        showLocation: false,
        message: 'Dispute opened',
        nextAction: 'Our support team will review this case'
      },
      owner: {
        canContactSupport: true,
        showContactInfo: false,
        showLocation: false,
        message: 'Dispute opened',
        nextAction: 'Our support team will review this case'
      }
    },
    DISPUTE_RESOLVED: {
      renter: {
        showContactInfo: false,
        showLocation: false,
        message: 'Dispute resolved',
        nextAction: null
      },
      owner: {
        showContactInfo: false,
        showLocation: false,
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
  createSystemMessage,
  STATE_TRANSITIONS
};
