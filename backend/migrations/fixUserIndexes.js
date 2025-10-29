const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function fixUserIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all existing indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the old username index if it exists
    try {
      await usersCollection.dropIndex('username_1');
      console.log('✓ Dropped old username_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('✓ username_1 index does not exist (already removed)');
      } else {
        console.error('Error dropping username index:', error.message);
      }
    }

    // Remove users with null nicknames (incomplete registrations)
    const deleteResult = await usersCollection.deleteMany({
      $or: [
        { nickname: null },
        { nickname: { $exists: false } }
      ]
    });
    console.log(`✓ Removed ${deleteResult.deletedCount} users with null/missing nicknames`);

    // Ensure nickname has a unique index
    try {
      await usersCollection.createIndex({ nickname: 1 }, { unique: true });
      console.log('✓ Created unique index on nickname');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('✓ Unique index on nickname already exists');
      } else {
        console.error('Error creating nickname index:', error.message);
      }
    }

    // Show final indexes
    const finalIndexes = await usersCollection.indexes();
    console.log('\nFinal indexes:', finalIndexes);

    console.log('\n✓ Database indexes fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixUserIndexes();
