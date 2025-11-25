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
    required: false // null for system messages
  },
  message_type: {
    type: String,
    enum: ['user_message', 'system_status', 'system_info'],
    default: 'user_message',
    required: true
  },
  content: {
    type: String,
    required: false,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  attachment: {
    type: String,
    default: null
  },
  status_reference: {
    type: String,
    enum: ['PENDING','ACCEPTED','PICKUP','PICKUP_OWNER','PICKUP_RENTER','IN_PROGRESS','RETURN','RETURN_OWNER','RETURN_RENTER','COMPLETED','REVIEWED',
    'CANCELLED','DECLINED','DISPUTED','DISPUTE_RESOLVED'],
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingMessageSchema.index({ booking_id: 1, createdAt: 1 });
bookingMessageSchema.index({ booking_id: 1, sender_id: 1 });

const BookingMessage = mongoose.model('BookingMessage', bookingMessageSchema);

module.exports = BookingMessage;
