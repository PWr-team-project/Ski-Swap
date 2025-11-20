const mongoose = require('mongoose');

const bookingPhotoSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['pickup', 'return', 'dispute'],
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const BookingPhoto = mongoose.model('BookingPhoto', bookingPhotoSchema);

module.exports = BookingPhoto;
