require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Listing = require('../models/Listing');

// Source and destination directories
const SOURCE_PHOTOS_DIR = 'C:\\Users\\HP\\OneDrive\\Pulpit\\listingPhotos';
const DEST_PHOTOS_DIR = path.join(__dirname, '..', 'uploads', 'listings');

async function checkAndFixPhotoPaths() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Ensure destination directory exists
    if (!fs.existsSync(DEST_PHOTOS_DIR)) {
      fs.mkdirSync(DEST_PHOTOS_DIR, { recursive: true });
      console.log(`✅ Created directory: ${DEST_PHOTOS_DIR}\n`);
    }

    // Get all listings
    console.log('🔍 Analyzing all listings...\n');
    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings\n`);

    if (listings.length === 0) {
      console.log('No listings to check.');
      return;
    }

    // Analyze current photo paths
    console.log('📊 Current photo path analysis:\n');
    let correctPaths = 0;
    let incorrectPaths = 0;
    let missingPhotos = 0;
    const incorrectListings = [];

    for (const listing of listings) {
      if (!listing.photos || listing.photos.length === 0) {
        missingPhotos++;
        incorrectListings.push({ listing, issue: 'no_photos' });
        console.log(`❌ "${listing.title}" - No photos`);
      } else {
        const photoPath = listing.photos[0];

        // Check if path starts with /uploads/listings/
        if (photoPath.startsWith('/uploads/listings/')) {
          correctPaths++;
          console.log(`✅ "${listing.title}" - Correct: ${photoPath}`);
        } else {
          incorrectPaths++;
          incorrectListings.push({ listing, issue: 'wrong_path', currentPath: photoPath });
          console.log(`❌ "${listing.title}" - Wrong: ${photoPath}`);
        }
      }
    }

    console.log('\n=== Analysis Summary ===');
    console.log(`✅ Correct paths: ${correctPaths}`);
    console.log(`❌ Incorrect paths: ${incorrectPaths}`);
    console.log(`❌ Missing photos: ${missingPhotos}`);
    console.log(`Total to fix: ${incorrectPaths + missingPhotos}\n`);

    if (incorrectListings.length === 0) {
      console.log('🎉 All listings have correct photo paths! No fixes needed.');
      return;
    }

    // Get available photos from source directory
    console.log('📷 Checking source photos directory...');
    let photoFiles = [];
    if (fs.existsSync(SOURCE_PHOTOS_DIR)) {
      photoFiles = fs.readdirSync(SOURCE_PHOTOS_DIR);
      console.log(`✅ Found ${photoFiles.length} photos in source directory\n`);
    } else {
      console.log(`⚠️  Source directory not found: ${SOURCE_PHOTOS_DIR}`);
      console.log('   Will only fix paths without copying new photos.\n');
    }

    // Copy photos to backend uploads directory
    if (photoFiles.length > 0) {
      console.log('📋 Copying photos to backend uploads directory...');
      let copiedCount = 0;
      let skippedCount = 0;

      for (const photoFile of photoFiles) {
        const sourcePath = path.join(SOURCE_PHOTOS_DIR, photoFile);
        const destPath = path.join(DEST_PHOTOS_DIR, photoFile);

        if (fs.existsSync(destPath)) {
          skippedCount++;
          continue;
        }

        try {
          fs.copyFileSync(sourcePath, destPath);
          copiedCount++;
        } catch (err) {
          console.error(`   ⚠️  Failed to copy ${photoFile}: ${err.message}`);
        }
      }

      console.log(`✅ Copied ${copiedCount} new photos`);
      console.log(`⏭️  Skipped ${skippedCount} existing photos\n`);
    }

    // Get list of photos now in backend directory
    const backendPhotos = fs.readdirSync(DEST_PHOTOS_DIR);
    console.log(`📁 Backend uploads directory now has ${backendPhotos.length} photos\n`);

    // Fix incorrect listings
    console.log('🔧 Fixing photo paths in database...\n');
    let fixedCount = 0;
    let photoIndex = 0;

    for (const { listing, issue, currentPath } of incorrectListings) {
      let newPhotoPath;

      if (issue === 'wrong_path' && currentPath) {
        // Try to extract filename from current path
        const filename = path.basename(currentPath);

        // Check if this file exists in backend uploads
        if (backendPhotos.includes(filename)) {
          newPhotoPath = `/uploads/listings/${filename}`;
        } else {
          // Assign a new photo from available photos
          if (photoIndex >= backendPhotos.length) {
            photoIndex = 0; // Loop back if we run out
          }
          newPhotoPath = `/uploads/listings/${backendPhotos[photoIndex]}`;
          photoIndex++;
        }
      } else if (issue === 'no_photos') {
        // Assign a photo from available photos
        if (photoIndex >= backendPhotos.length) {
          photoIndex = 0;
        }
        newPhotoPath = `/uploads/listings/${backendPhotos[photoIndex]}`;
        photoIndex++;
      }

      if (newPhotoPath) {
        listing.photos = [newPhotoPath];
        await listing.save();
        fixedCount++;
        console.log(`   ✓ Fixed: "${listing.title}"`);
        console.log(`     Old: ${currentPath || 'none'}`);
        console.log(`     New: ${newPhotoPath}\n`);
      }
    }

    // Final verification
    console.log('=== Final Verification ===\n');
    const allListings = await Listing.find({});
    let finalCorrect = 0;
    let finalIncorrect = 0;

    for (const listing of allListings) {
      if (listing.photos && listing.photos.length > 0) {
        if (listing.photos[0].startsWith('/uploads/listings/')) {
          finalCorrect++;
        } else {
          finalIncorrect++;
        }
      } else {
        finalIncorrect++;
      }
    }

    console.log(`✅ Correct photo paths: ${finalCorrect}/${allListings.length}`);
    console.log(`❌ Still incorrect: ${finalIncorrect}/${allListings.length}`);

    if (finalIncorrect === 0) {
      console.log('\n🎉 SUCCESS! All listings now have correct photo paths!');
      console.log('   Your colleague should be able to see all photos now.\n');
    } else {
      console.log('\n⚠️  Some listings still have issues. Review the output above.\n');
    }

    // Show sample of fixed listings
    console.log('📸 Sample of listings with photos:');
    const sampleListings = await Listing.find({ photos: { $exists: true, $ne: [] } }).limit(5);
    sampleListings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title}`);
      console.log(`      Photo: ${listing.photos[0]}\n`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
checkAndFixPhotoPaths();
