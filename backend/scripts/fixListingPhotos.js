require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Listing = require('../models/Listing');

// Source and destination directories
const SOURCE_PHOTOS_DIR = 'C:\\Users\\HP\\OneDrive\\Pulpit\\listingPhotos';
const DEST_PHOTOS_DIR = path.join(__dirname, '..', 'uploads', 'listings');

async function fixListingPhotos() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Ensure destination directory exists
    if (!fs.existsSync(DEST_PHOTOS_DIR)) {
      fs.mkdirSync(DEST_PHOTOS_DIR, { recursive: true });
      console.log(`✅ Created directory: ${DEST_PHOTOS_DIR}\n`);
    }

    // Get all photo files from source directory
    console.log('📷 Reading photos from source directory...');
    if (!fs.existsSync(SOURCE_PHOTOS_DIR)) {
      throw new Error(`Source directory not found: ${SOURCE_PHOTOS_DIR}`);
    }

    const photoFiles = fs.readdirSync(SOURCE_PHOTOS_DIR);
    console.log(`✅ Found ${photoFiles.length} photos in source directory\n`);

    // Copy photos to destination directory
    console.log('📋 Copying photos to backend uploads directory...');
    let copiedCount = 0;
    let skippedCount = 0;

    for (const photoFile of photoFiles) {
      const sourcePath = path.join(SOURCE_PHOTOS_DIR, photoFile);
      const destPath = path.join(DEST_PHOTOS_DIR, photoFile);

      // Check if file already exists in destination
      if (fs.existsSync(destPath)) {
        skippedCount++;
        continue;
      }

      // Copy the file
      try {
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
      } catch (err) {
        console.error(`   ⚠️  Failed to copy ${photoFile}: ${err.message}`);
      }
    }

    console.log(`✅ Copied ${copiedCount} photos`);
    console.log(`⏭️  Skipped ${skippedCount} existing photos\n`);

    // Get all listings
    console.log('🔍 Finding all listings...');
    const listings = await Listing.find({});
    console.log(`✅ Found ${listings.length} listings\n`);

    if (listings.length === 0) {
      console.log('No listings to fix.');
      return;
    }

    // Fix each listing
    console.log('🔧 Fixing listing photos...\n');
    let fixedCount = 0;
    let photoIndex = 0;

    for (const listing of listings) {
      // Check if listing already has proper photo path
      if (listing.photos && listing.photos.length > 0) {
        const currentPhoto = listing.photos[0];

        // If photo path is already correct, skip
        if (currentPhoto.startsWith('/uploads/listings/')) {
          console.log(`   ✓ Listing "${listing.title}" - already has correct photo path`);
          continue;
        }
      }

      // Assign a new photo from the pool
      if (photoIndex >= photoFiles.length) {
        photoIndex = 0; // Reset to beginning if we run out
      }

      const photoFile = photoFiles[photoIndex];
      const newPhotoPath = `/uploads/listings/${photoFile}`;

      // Update listing
      listing.photos = [newPhotoPath];
      await listing.save();

      fixedCount++;
      photoIndex++;

      console.log(`   ✓ Fixed listing "${listing.title}" - assigned photo: ${photoFile}`);
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`📷 Total photos available: ${photoFiles.length}`);
    console.log(`📋 Total listings: ${listings.length}`);
    console.log(`🔧 Listings fixed: ${fixedCount}`);
    console.log(`✅ Listings already correct: ${listings.length - fixedCount}`);

    // Verify all listings have photos
    const listingsWithoutPhotos = await Listing.countDocuments({
      $or: [
        { photos: { $exists: false } },
        { photos: { $size: 0 } }
      ]
    });

    if (listingsWithoutPhotos > 0) {
      console.log(`\n⚠️  Warning: ${listingsWithoutPhotos} listings still don't have photos`);
    } else {
      console.log('\n✅ All listings now have photos!');
    }

    // Show sample of fixed listings
    console.log('\n📸 Sample of fixed listings:');
    const sampleListings = await Listing.find({}).limit(5);
    sampleListings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title}`);
      console.log(`      Photo: ${listing.photos[0]}`);
    });

    console.log('\n✅ Photo fix completed successfully!');

  } catch (error) {
    console.error('\n❌ Error fixing listing photos:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
fixListingPhotos();
