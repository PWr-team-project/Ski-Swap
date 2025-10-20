const mongoose = require('mongoose');

const bookingStatusSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  payment_flag: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ongoing', 'completed', 'dispute', 'cancelled'],
    default: 'pending',
    required: true
  },
  renter_pickup: {
    type: Boolean,
    default: false
  },
  renter_pickup_photos: {
    type: [String], // Array of image URLs
    default: []
  },
  owner_pickup: {
    type: Boolean,
    default: false
  },
  renter_return: {
    type: Boolean,
    default: false
  },
  renter_return_photos: {
    type: [String], // Array of image URLs
    default: []
  },
  owner_return: {
    type: Boolean,
    default: false
  },
  dispute: {
    type: Boolean,
    default: false
  },
  dispute_description: {
    type: String,
    trim: true
  },
  dispute_photos: {
    type: [String], 
    default: []
  }
}, {
  timestamps: true
});


const BookingStatus = mongoose.model('BookingStatus', bookingStatusSchema);

module.exports = BookingStatus;
