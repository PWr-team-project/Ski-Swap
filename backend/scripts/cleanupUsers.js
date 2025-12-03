require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

// Users to keep
const PROTECTED_EMAILS = [
  'admin@admin.com',
  'skiswap@gmail.com'
];

// Function to prompt user for confirmation
function confirmCleanup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This will permanently delete:');
    console.log('   - ALL users EXCEPT:');
    console.log('     • admin@admin.com');
    console.log('     • skiswap@gmail.com');
    console.log('   - ALL verification requests');
    console.log('\n❗ This action cannot be undone!\n');

    rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function cleanupUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get confirmation from user
    const confirmed = await confirmCleanup();

    if (!confirmed) {
      console.log('\n❌ Cleanup cancelled by user');
      process.exit(0);
    }

    console.log('\n🗑️  Starting user cleanup...\n');

    // Count documents before deletion
    const totalUsersBefore = await User.countDocuments();
    const protectedUsers = await User.find({ email: { $in: PROTECTED_EMAILS } });
    const verificationRequestsBefore = await VerificationRequest.countDocuments();

    console.log('📊 Current counts:');
    console.log(`   Total Users: ${totalUsersBefore}`);
    console.log(`   Protected Users: ${protectedUsers.length}`);
    console.log(`   Verification Requests: ${verificationRequestsBefore}`);
    console.log('\n');

    // Display protected users
    console.log('🔒 Protected users that will be kept:');
    protectedUsers.forEach(user => {
      console.log(`   • ${user.first_name} ${user.last_name} (${user.email})`);
    });
    console.log('\n');

    // 1. Delete all verification requests
    console.log('  [1/2] Deleting all verification requests...');
    const verificationResult = await VerificationRequest.deleteMany({});
    console.log(`  ✅ Deleted ${verificationResult.deletedCount} verification requests\n`);

    // 2. Delete all users except protected ones
    console.log('  [2/2] Deleting users (except protected)...');
    const userDeleteResult = await User.deleteMany({
      email: { $nin: PROTECTED_EMAILS }
    });
    console.log(`  ✅ Deleted ${userDeleteResult.deletedCount} users\n`);

    // Verify remaining users
    const remainingUsers = await User.find({}).sort({ email: 1 });
    const totalUsersAfter = await User.countDocuments();
    const verificationRequestsAfter = await VerificationRequest.countDocuments();

    console.log('📊 Final counts:');
    console.log(`   Total Users: ${totalUsersAfter}`);
    console.log(`   Verification Requests: ${verificationRequestsAfter}`);
    console.log('\n');

    console.log('👥 Remaining users in database:');
    remainingUsers.forEach(user => {
      console.log(`   • ${user.first_name} ${user.last_name} (${user.email})`);
    });

    console.log('\n✅ User cleanup completed successfully!');
    console.log(`📝 Total records deleted: ${userDeleteResult.deletedCount + verificationResult.deletedCount}`);
    console.log(`   - Users deleted: ${userDeleteResult.deletedCount}`);
    console.log(`   - Verification requests deleted: ${verificationResult.deletedCount}`);
    console.log(`   - Users preserved: ${totalUsersAfter}\n`);

  } catch (error) {
    console.error('\n❌ Error during user cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
cleanupUsers();
