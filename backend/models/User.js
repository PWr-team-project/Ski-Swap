const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_type: {
    type: String,
    enum: ['individual', 'company', 'admin'],
    required: true,
    default: 'individual'
  },
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  admin_flag: {
    type: Boolean,
    default: false
  },
  blocked_flag: {
    type: Boolean,
    default: false
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password_hash: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    trim: true
  },
  profile_photo: {
    type: String, // URL or path to the image
    default: null
  },
  background_photo: {
    type: String, // URL or path to the image
    default: null
  },
  profile_description: {
    type: String,
    maxlength: 1000
  },
  id_verified: {
    type: Boolean,
    default: false
  },
  rating_avg: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  }
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

module.exports = User;
