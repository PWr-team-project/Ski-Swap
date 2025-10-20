const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  attachment: {
    type: String, 
    default: null
  },
  message_text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  sent_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  read_at: {
    type: Date,
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  deleted_by_sender: {
    type: Boolean,
    default: false
  },
  deleted_by_receiver: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
