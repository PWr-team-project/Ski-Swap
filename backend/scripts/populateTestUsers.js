require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Function to generate random 10-digit NIP number
function generateNIP() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Users to create
const usersToCreate = [
  // Individual users
  {
    user_type: 'individual',
    nickname: 'user1',
    first_name: 'User',
    last_name: 'One',
    email: 'user1@example.com',
    password: '123456',
    phone_number: null,
    NIP_number: null
  },
  {
    user_type: 'individual',
    nickname: 'user2',
    first_name: 'User',
    last_name: 'Two',
    email: 'user2@example.com',
    password: '123456',
    phone_number: null,
    NIP_number: null
  },
  {
    user_type: 'individual',
    nickname: 'user3',
    first_name: 'User',
    last_name: 'Three',
    email: 'user3@example.com',
    password: '123456',
    phone_number: null,
    NIP_number: null
  },
  // Company users
  {
    user_type: 'company',
    nickname: 'company1',
    first_name: 'Company',
    last_name: 'One',
    email: 'company1@example.com',
    password: '123456',
    phone_number: null,
    NIP_number: generateNIP()
  },
  {
    user_type: 'company',
    nickname: 'company2',
    first_name: 'Company',
    last_name: 'Two',
    email: 'company2@example.com',
    password: '123456',
    phone_number: null,
    NIP_number: generateNIP()
  },
  {
    user_type: 'company',
    nickname: 'company3',
    first_name: 'Company',
    last_name: 'Three',
    email: 'company3@example.com',
    password: '123456',
    phone_number: null,
    NIP_number: generateNIP()
  }
];

async function populateUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔄 Creating test users...\n');

    // Check if any users already exist
    for (const userData of usersToCreate) {
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { nickname: userData.nickname }
        ]
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.nickname} (${userData.email}) already exists - skipping`);
        continue;
      }

      // Hash the password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const newUser = new User({
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
        NIP_number: userData.NIP_number,
        profile_description: null,
        id_verified: false,
        rating_avg: 0,
        reponse_rate: 100,
        reponse_time: 'few hours'
      });

      await newUser.save();

      console.log(`✅ Created ${userData.user_type} user: ${userData.nickname}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Name: ${userData.first_name} ${userData.last_name}`);
      if (userData.NIP_number) {
        console.log(`   NIP: ${userData.NIP_number}`);
      }
      console.log('');
    }

    // Summary
    const totalUsers = await User.countDocuments();
    const individualUsers = await User.countDocuments({ user_type: 'individual' });
    const companyUsers = await User.countDocuments({ user_type: 'company' });

    console.log('\n=== Summary ===');
    console.log(`Total Users in database: ${totalUsers}`);
    console.log(`Individual users: ${individualUsers}`);
    console.log(`Company users: ${companyUsers}`);

    console.log('\n📝 Login credentials for new users:');
    console.log('   All users have password: 123456');
    console.log('\n   Individual users:');
    usersToCreate.filter(u => u.user_type === 'individual').forEach(u => {
      console.log(`   • ${u.nickname} (${u.email})`);
    });
    console.log('\n   Company users:');
    usersToCreate.filter(u => u.user_type === 'company').forEach(u => {
      console.log(`   • ${u.nickname} (${u.email})`);
    });

    console.log('\n✅ User population completed successfully!');

  } catch (error) {
    console.error('\n❌ Error populating users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
populateUsers();
