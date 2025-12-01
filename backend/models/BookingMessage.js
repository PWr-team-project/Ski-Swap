const mongoose = require('mongoose');

const bookingMessageSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null for system messages (status changes)
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'status_change'],
    default: 'text',
    required: true
  },
  message_text: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  attachment: {
    type: String, // Image path/URL
    default: null
  },
  // For status_change messages
  status_change: {
    from_status: {
      type: String,
      enum: ['PENDING','ACCEPTED','PICKUP','PICKUP_OWNER','PICKUP_RENTER','IN_PROGRESS','RETURN','RETURN_OWNER','RETURN_RENTER','COMPLETED','REVIEWED',
      'CANCELLED','DECLINED','DISPUTED','DISPUTE_RESOLVED']
    },
    to_status: {
      type: String,
      enum: ['PENDING','ACCEPTED','PICKUP','PICKUP_OWNER','PICKUP_RENTER','IN_PROGRESS','RETURN','RETURN_OWNER','RETURN_RENTER','COMPLETED','REVIEWED',
      'CANCELLED','DECLINED','DISPUTED','DISPUTE_RESOLVED']
    }
  },
  sent_at: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries - get messages by booking and chronological order
bookingMessageSchema.index({ booking_id: 1, sent_at: 1 });

const BookingMessage = mongoose.model('BookingMessage', bookingMessageSchema);

module.exports = BookingMessage;
