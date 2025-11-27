const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true,
    maxlength: 35
  },
  street_number: {
    type: String,
    trim: true,
    maxlength: 5
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  postcode: {
    type: String,
    trim: true,
    maxlength: 7
  },
  state: {
    type: String,
    trim: true,
    maxlength: 35
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
}, {
  timestamps: true
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
