const mongoose = require('mongoose');

const bookingStatus = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true // Changed from unique to index for history tracking
  },
  status: {
    type: String,
    enum: ['PENDING','ACCEPTED','PICKUP','PICKUP_OWNER','PICKUP_RENTER','IN_PROGRESS','RETURN','RETURN_OWNER','RETURN_RENTER','COMPLETED','REVIEWED',
    'CANCELLED','DECLINED','DISPUTED','DISPUTE_RESOLVED'],
    default: 'PENDING',
    required: true
  },
  changed_by:{
    type: String,
    enum: ['renter','owner','system'],
    required: true
  },
  changed_by_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null for system changes
  },
  notes: {
    type: String,
    trim: true
  }

}, {
  timestamps: true
});

// Index for efficient queries - get latest status per booking
bookingStatus.index({ booking_id: 1, createdAt: -1 });


const BookingStatus = mongoose.model('BookingStatus', bookingStatus);

module.exports = BookingStatus;
