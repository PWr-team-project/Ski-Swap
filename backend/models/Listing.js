const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  photos: {
    type: [String], // Array of image URLs or paths
    default: [],
    validate: {
      validator: function(array) {
        return array.length <= 10; // Limit to 10 photos
      },
      message: 'A listing can have maximum 10 photos'
    }
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  daily_rate: {
    type: Number,
    required: true,
    min: 0
  },
  weekly_rate: {
    type: Number,
    min: 0
  },
  monthly_rate: {
    type: Number,
    min: 0
  },
  estimated_value: {
    type: Number,
    min: 0
  },
  condition: {
    type: String,
    enum: ['new', 'like new', 'good', 'fair', 'used'],
    required: true
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
