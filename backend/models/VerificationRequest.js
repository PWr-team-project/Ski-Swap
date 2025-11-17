const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  date_of_birth: {
    type: Date,
    required: true
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  id_number: {
    type: String,
    required: true,
    trim: true
  },
  id_document_photo: {
    type: String, // Path to uploaded document
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewed_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

module.exports = VerificationRequest;
