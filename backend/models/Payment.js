const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: {
  type: String,
  unique: true,
  trim: true,
  },
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  payer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  insurance_amount: {
    type: Number,
    default: 0,
  },
  currency:{
    type: String,
    enum: ['USD', 'EUR', 'PLN'],
    default: 'EUR',
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    required: true,
  },
  refund_reason: {
    type: String,
    trim: true,
  },

}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
