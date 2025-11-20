require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Location = require('../models/Location');

// Sample user data with diverse profiles
const SAMPLE_USERS = [
  {
    user_type: 'individual',
    nickname: 'ski_enthusiast_99',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone_number: '+1-555-0101',
    profile_description: 'Passionate skier with 10+ years of experience. Love exploring new slopes and meeting fellow ski enthusiasts!',
    id_verified: true,
    rating_avg: 4.8,
    reponse_rate: 95,
    reponse_time: 'few hours',
    location: {
      city: 'Denver',
      state: 'Colorado',
      country: 'USA',
      latitude: 39.7392,
      longitude: -104.9903,
      street: 'Main Street',
      street_number: '123'
    }
  },
  {
    user_type: 'company',
    nickname: 'mountain_rentals_co',
    first_name: 'Mountain',
    last_name: 'Rentals LLC',
    email: 'info@mountainrentals.com',
    phone_number: '+1-555-0202',
    NIP_number: '1234567890',
    website_address: 'https://mountainrentals.com',
    profile_description: 'Professional ski equipment rental company. Top-quality gear, competitive prices, and excellent customer service since 2010.',
    id_verified: true,
    rating_avg: 4.9,
    reponse_rate: 100,
    reponse_time: 'few hours',
    location: {
      city: 'Aspen',
      state: 'Colorado',
      country: 'USA',
      latitude: 39.1911,
      longitude: -106.8175,
      street: 'Mountain View Drive',
      street_number: '456'
    }
  },
  {
    user_type: 'individual',
    nickname: 'powder_hunter',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@example.com',
    phone_number: '+1-555-0303',
    profile_description: 'Weekend warrior looking to rent quality equipment. Always happy to share tips and recommendations!',
    id_verified: false,
    rating_avg: 4.5,
    reponse_rate: 85,
    reponse_time: 'within a day',
    location: {
      city: 'Salt Lake City',
      state: 'Utah',
      country: 'USA',
      latitude: 40.7608,
      longitude: -111.8910,
      street: 'Park Avenue',
      street_number: '789'
    }
  },
  {
    user_type: 'individual',
    nickname: 'alpine_adventures',
    first_name: 'Emma',
    last_name: 'Rodriguez',
    email: 'emma.rodriguez@example.com',
    phone_number: '+1-555-0404',
    profile_description: 'Ski instructor and outdoor enthusiast. Renting out my personal collection when I\'m not using it. All equipment is well-maintained and in excellent condition.',
    id_verified: true,
    rating_avg: 5.0,
    reponse_rate: 98,
    reponse_time: 'few hours',
    location: {
      city: 'Lake Tahoe',
      state: 'California',
      country: 'USA',
      latitude: 39.0968,
      longitude: -120.0324,
      street: 'Lakeshore Boulevard',
      street_number: '321'
    }
  },
  {
    user_type: 'individual',
    nickname: 'first_timer_alex',
    first_name: 'Alex',
    last_name: 'Thompson',
    email: 'alex.thompson@example.com',
    phone_number: '+1-555-0505',
    profile_description: 'New to skiing but excited to learn! Looking forward to trying different equipment.',
    id_verified: false,
    rating_avg: 0,
    reponse_rate: 100,
    reponse_time: 'within a few days',
    location: {
      city: 'Seattle',
      state: 'Washington',
      country: 'USA',
      latitude: 47.6062,
      longitude: -122.3321,
      street: 'Pine Street',
      street_number: '654'
    }
  }
];

async function populateUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fix googleId index to be sparse (allows multiple null values)
    console.log('Checking googleId index...');
    try {
      await User.collection.dropIndex('googleId_1');
      console.log('Dropped existing googleId index');
    } catch (err) {
      // Index might not exist, that's ok
      console.log('No existing googleId index to drop');
    }

    // Create sparse unique index on googleId
    await User.collection.createIndex(
      { googleId: 1 },
      { unique: true, sparse: true }
    );
    console.log('Created sparse unique index on googleId');

    console.log('\n=== Creating 5 sample users ===\n');

    for (let i = 0; i < SAMPLE_USERS.length; i++) {
      const userData = SAMPLE_USERS[i];

      // Check if user with this email already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`  [${i + 1}/5] User ${userData.email} already exists - skipping`);
        continue;
      }

      // Create location first
      const location = new Location(userData.location);
      await location.save();
      console.log(`  [${i + 1}/5] Created location: ${location.city}, ${location.state}`);

      // Hash password (using simple password for demo purposes)
      const password_hash = await bcrypt.hash('Password123!', 10);

      // Create user (don't set googleId field at all for local users)
      const user = new User({
        user_type: userData.user_type,
        nickname: userData.nickname,
        admin_flag: false,
        blocked_flag: false,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password_hash: password_hash,
        oauth_provider: 'local',
        phone_number: userData.phone_number,
        NIP_number: userData.NIP_number || null,
        website_address: userData.website_address || null,
        profile_photo: null,
        background_photo: null,
        profile_description: userData.profile_description,
        id_verified: userData.id_verified,
        rating_avg: userData.rating_avg,
        reponse_rate: userData.reponse_rate,
        reponse_time: userData.reponse_time,
        location_id: location._id
      });

      // Explicitly unset googleId to avoid duplicate key error
      user.googleId = undefined;

      await user.save();
      console.log(`  [${i + 1}/5] Created user: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`        Type: ${user.user_type} | Nickname: ${user.nickname} | Rating: ${user.rating_avg}`);
      console.log('');
    }

    // Summary
    const totalUsers = await User.countDocuments();
    const individualUsers = await User.countDocuments({ user_type: 'individual' });
    const companyUsers = await User.countDocuments({ user_type: 'company' });
    const verifiedUsers = await User.countDocuments({ id_verified: true });

    console.log('=== Summary ===');
    console.log(`Total Users in database: ${totalUsers}`);
    console.log(`  Individual users: ${individualUsers}`);
    console.log(`  Company users: ${companyUsers}`);
    console.log(`  Verified users: ${verifiedUsers}`);
    console.log('\nAll users have password: Password123!');
    console.log('\n✅ User population completed successfully!');

  } catch (error) {
    console.error('Error populating users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
populateUsers();
