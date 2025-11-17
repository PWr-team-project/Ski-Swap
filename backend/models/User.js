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
    unique: true,
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
    required: function() {
      // Password is required only if not using OAuth
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple undefined/missing values while maintaining uniqueness for actual values
    // No default - field will be undefined for non-OAuth users
  },
  oauth_provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  phone_number: {
    type: String,
    trim: true
  },
  NIP_number: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        // Only validate if user_type is 'company' and NIP is provided
        if (this.user_type === 'company' && v) {
          return /^\d{10}$/.test(v); 
        }
        return true;
      },
      message: 'NIP number must be 10 digits'
    }
  },
  website_address: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        // Only validate if value is provided
        if (v) {
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        }
        return true;
      },
      message: 'Please enter a valid website URL'
    }
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
  reponse_rate:{
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  reponse_time:{
    enum: ['few hours', 'within a day', 'within a few days'],
    type: String,
    default: 'few hours'
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
