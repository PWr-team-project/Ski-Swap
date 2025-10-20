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
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
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
  },
  helpful_count: {
    type: Number,
    default: 0,
    min: 0
  },
  response: {
    type: String,
    trim: true,
    maxlength: 500
  },
  response_date: {
    type: Date
  }
}, {
  timestamps: true
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
