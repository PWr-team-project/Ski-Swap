const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  suggested_price_daily: {
    type: Number,
    min: 0,
    default: 0
  },
  suggested_price_weekly: {
    type: Number,
    min: 0,
    default: 0
  },
  suggested_price_monthly: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});


const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
