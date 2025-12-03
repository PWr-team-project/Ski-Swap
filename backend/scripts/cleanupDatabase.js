require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const readline = require('readline');

// Import all models except User
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const BookingMessage = require('../models/BookingMessage');
const BookingPhoto = require('../models/BookingPhoto');
const BookingStatus = require('../models/BookingStatus');
const Category = require('../models/Category');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// Function to prompt user for confirmation
function confirmCleanup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This will permanently delete ALL of the following data:');
    console.log('   - Listings');
    console.log('   - Bookings');
    console.log('   - Booking Messages');
    console.log('   - Booking Photos');
    console.log('   - Booking Status records');
    console.log('   - Categories');
    console.log('   - Conversations');
    console.log('   - Messages');
    console.log('   - Payments');
    console.log('   - Reviews');
    console.log('\n✅ Users will NOT be deleted\n');

    rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function cleanupDatabase() {
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

    console.log('\n🗑️  Starting database cleanup...\n');

    // Count documents before deletion
    const beforeCounts = {
      listings: await Listing.countDocuments(),
      bookings: await Booking.countDocuments(),
      bookingMessages: await BookingMessage.countDocuments(),
      bookingPhotos: await BookingPhoto.countDocuments(),
      bookingStatuses: await BookingStatus.countDocuments(),
      categories: await Category.countDocuments(),
      conversations: await Conversation.countDocuments(),
      messages: await Message.countDocuments(),
      payments: await Payment.countDocuments(),
      reviews: await Review.countDocuments()
    };

    console.log('📊 Current document counts:');
    console.log(`   Listings: ${beforeCounts.listings}`);
    console.log(`   Bookings: ${beforeCounts.bookings}`);
    console.log(`   Booking Messages: ${beforeCounts.bookingMessages}`);
    console.log(`   Booking Photos: ${beforeCounts.bookingPhotos}`);
    console.log(`   Booking Statuses: ${beforeCounts.bookingStatuses}`);
    console.log(`   Categories: ${beforeCounts.categories}`);
    console.log(`   Conversations: ${beforeCounts.conversations}`);
    console.log(`   Messages: ${beforeCounts.messages}`);
    console.log(`   Payments: ${beforeCounts.payments}`);
    console.log(`   Reviews: ${beforeCounts.reviews}`);
    console.log('\n');

    // Delete in order to respect foreign key dependencies
    console.log('Deleting data...');

    // 1. Delete reviews (depends on bookings and listings)
    console.log('  [1/10] Deleting Reviews...');
    await Review.deleteMany({});
    console.log('  ✅ Reviews deleted');

    // 2. Delete payments (depends on bookings)
    console.log('  [2/10] Deleting Payments...');
    await Payment.deleteMany({});
    console.log('  ✅ Payments deleted');

    // 3. Delete booking photos (depends on bookings)
    console.log('  [3/10] Deleting Booking Photos...');
    await BookingPhoto.deleteMany({});
    console.log('  ✅ Booking Photos deleted');

    // 4. Delete booking messages (depends on bookings)
    console.log('  [4/10] Deleting Booking Messages...');
    await BookingMessage.deleteMany({});
    console.log('  ✅ Booking Messages deleted');

    // 5. Delete booking statuses (depends on bookings)
    console.log('  [5/10] Deleting Booking Statuses...');
    await BookingStatus.deleteMany({});
    console.log('  ✅ Booking Statuses deleted');

    // 6. Delete bookings (depends on listings)
    console.log('  [6/10] Deleting Bookings...');
    await Booking.deleteMany({});
    console.log('  ✅ Bookings deleted');

    // 7. Delete messages (depends on conversations)
    console.log('  [7/10] Deleting Messages...');
    await Message.deleteMany({});
    console.log('  ✅ Messages deleted');

    // 8. Delete conversations
    console.log('  [8/10] Deleting Conversations...');
    await Conversation.deleteMany({});
    console.log('  ✅ Conversations deleted');

    // 9. Delete listings (depends on categories)
    console.log('  [9/10] Deleting Listings...');
    await Listing.deleteMany({});
    console.log('  ✅ Listings deleted');

    // 10. Delete categories
    console.log('  [10/10] Deleting Categories...');
    await Category.deleteMany({});
    console.log('  ✅ Categories deleted');

    // Verify deletion
    console.log('\n📊 Final document counts:');
    console.log(`   Listings: ${await Listing.countDocuments()}`);
    console.log(`   Bookings: ${await Booking.countDocuments()}`);
    console.log(`   Booking Messages: ${await BookingMessage.countDocuments()}`);
    console.log(`   Booking Photos: ${await BookingPhoto.countDocuments()}`);
    console.log(`   Booking Statuses: ${await BookingStatus.countDocuments()}`);
    console.log(`   Categories: ${await Category.countDocuments()}`);
    console.log(`   Conversations: ${await Conversation.countDocuments()}`);
    console.log(`   Messages: ${await Message.countDocuments()}`);
    console.log(`   Payments: ${await Payment.countDocuments()}`);
    console.log(`   Reviews: ${await Review.countDocuments()}`);

    // Calculate total deleted
    const totalDeleted = Object.values(beforeCounts).reduce((sum, count) => sum + count, 0);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log(`📝 Total records deleted: ${totalDeleted}`);
    console.log('👥 Users were preserved (not deleted)\n');

  } catch (error) {
    console.error('\n❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
cleanupDatabase();
