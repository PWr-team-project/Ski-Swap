require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');

async function deleteListingsTEST() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Ski Swapper user
    const skiSwapper = await User.findOne({
      $or: [
        { email: 'skiswap@gmail.com' },
        { first_name: 'Ski', last_name: 'Swapper' },
        { nickname: 'Ski Swapper' }
      ]
    });
    if (!skiSwapper) {
      console.error('Ski Swapper user not found!');
      console.error('Looking for user with email "skiswap@gmail.com" or name "Ski Swapper"');
      process.exit(1);
    }
    console.log(`Found Ski Swapper: ${skiSwapper.first_name} ${skiSwapper.last_name} (${skiSwapper.email})`);

    // Find panpatlyk user
    const panpatlyk = await User.findOne({
      $or: [
        { email: /panpatlyk/i },
        { first_name: /panpatlyk/i },
        { last_name: /panpatlyk/i },
        { nickname: /panpatlyk/i }
      ]
    });
    if (!panpatlyk) {
      console.error('panpatlyk user not found!');
      console.error('Looking for user with email, name, or nickname containing "panpatlyk"');
      process.exit(1);
    }
    console.log(`Found panpatlyk: ${panpatlyk.first_name} ${panpatlyk.last_name} (${panpatlyk.email})`);

    // Count existing listings before deletion
    const skiSwapperCount = await Listing.countDocuments({ owner_id: skiSwapper._id });
    const panpatlykCount = await Listing.countDocuments({ owner_id: panpatlyk._id });
    const totalCount = skiSwapperCount + panpatlykCount;

    console.log(`\n=== Found listings to delete ===`);
    console.log(`Listings owned by ${skiSwapper.first_name} ${skiSwapper.last_name}: ${skiSwapperCount}`);
    console.log(`Listings owned by ${panpatlyk.first_name} ${panpatlyk.last_name}: ${panpatlykCount}`);
    console.log(`Total listings to delete: ${totalCount}`);

    if (totalCount === 0) {
      console.log('\nNo listings found to delete.');
      return;
    }

    // Delete listings for both users
    console.log('\nDeleting listings...');
    const deleteResult = await Listing.deleteMany({
      owner_id: { $in: [skiSwapper._id, panpatlyk._id] }
    });

    console.log(`\n✅ Deleted ${deleteResult.deletedCount} listings successfully!`);
    console.log('Only listings owned by Ski Swapper and panpatlyk were deleted.');
    console.log('All other listings in the database remain intact.');

  } catch (error) {
    console.error('Error deleting test listings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
deleteListingsTEST();
