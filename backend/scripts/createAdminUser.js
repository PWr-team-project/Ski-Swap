require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Nickname:', existingAdmin.nickname);
      await mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('adminadmin', salt);

    // Create admin user
    const adminUser = new User({
      nickname: 'admin',
      email: 'admin@admin.com',
      password_hash: password_hash,
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'individual',
      admin_flag: true,
      oauth_provider: 'local'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@admin.com');
    console.log('Password: adminadmin');
    console.log('Nickname: admin');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createAdminUser();
