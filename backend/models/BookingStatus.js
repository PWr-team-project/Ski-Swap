const mongoose = require('mongoose');

const bookingStatusHistory = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING','ACCEPTED','PICKUP','IN_PROGRESS','RETURN','VERIFY','COMPLETED','REVIEWED',
    'CANCELLED','DECLINED','DISPUTED','DISPUTE_RESOLVED'],
    default: 'PENDING',
    required: true
  },
  changed_by:{
    typpe: String,
    enum: ['renter','owner','system'],
    required: true
  }

}, {
  timestamps: true
});


const BookingStatus = mongoose.model('BookingStatus', bookingStatusSchema);

module.exports = BookingStatus;
