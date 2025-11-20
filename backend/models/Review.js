const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  renter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  review_type: {
    type: String,
    enum: ['renter_to_owner', 'owner_to_renter', 'renter_to_listing'],
    required: true
  },
  listing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: null
  }
}, {
  timestamps: true
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
