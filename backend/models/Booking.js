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
    enum: ['PENDING','ACCEPTED','PICKUP','IN_PROGRESS','RETURN','VERIFY','COMPLETED','REVIEWED',
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
  total_price: {
    // Without insurance
    type: Number,
    required: true,
    min: 0
  },
  payment_confirmed:{
    type: Boolean,
    default: false
  }
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
