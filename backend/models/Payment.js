const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  payer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash'],
    required: true
  },
  transaction_id: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    required: true
  },
  refund_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  refund_reason: {
    type: String,
    trim: true
  },
  payment_gateway_response: {
    type: mongoose.Schema.Types.Mixed, // Store raw response from payment gateway
    default: null
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
