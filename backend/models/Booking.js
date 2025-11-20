const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  listing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  current_status:{
    type: String,
    enum: ['PENDING','ACCEPTED','PICKUP','PICKUP_OWNER','PICKUP_RENTER','IN_PROGRESS','RETURN','RETURN_OWNER','RETURN_RENTER','COMPLETED','REVIEWED',
    'CANCELLED','DECLINED','DISPUTED','DISPUTE_RESOLVED'],
    default: 'PENDING',
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.start_date;
      },
      message: 'End date must be after start date'
    }
  },
  insurance_flag: {
    type: Boolean,
    default: false
  },
  base_price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: (v) => {
        return v <= this.amount
      },
      message: 'Discount amount cannot be greater than the payment amount.',
    },
  },
  tax_rate: {
    type: Number,
    default: 23,
    min: 0,
    max: 100,
  },
  skiswap_fee: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    // Without insurance
    type: Number,
    virtual: true,
    get: function() {
      return (this.base_price - this.discount) * (1 + this.tax_rate / 100) + this.skiswap_fee;
    }
  },
  payment_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ renter_id: 1 });
bookingSchema.index({ owner_id: 1 });
bookingSchema.index({ listing_id: 1 });
bookingSchema.index({ current_status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
