const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample review comments
const reviewComments = [
  "Great experience! The equipment was in excellent condition and the owner was very responsive.",
  "Very professional and friendly. The rental process was smooth and hassle-free.",
  "Equipment was as described. Owner was punctual and helpful. Would rent again!",
  "Amazing service! The owner went above and beyond to ensure I had everything I needed.",
  "Good quality equipment. Owner was easy to communicate with and very accommodating.",
  "Fantastic experience from start to finish. Highly recommend renting from this owner!",
  "The owner was super helpful and provided great tips for using the equipment. Five stars!",
  "Very satisfied with the rental. Equipment was clean and well-maintained.",
  "Excellent communication and the equipment exceeded my expectations. Will definitely rent again!",
  "Professional and trustworthy owner. The equipment was perfect for my trip!"
];

const populateReviews = async () => {
  try {
    console.log('Starting reviews population...\n');

    // Find the main user (skiswap@gmail.com)
    const mainUser = await User.findOne({ email: 'skiswap@gmail.com' });
    if (!mainUser) {
      console.error('❌ User skiswap@gmail.com not found. Please run populateListings.js first.');
      return;
    }
    console.log(`✓ Found main user: ${mainUser.email}\n`);

    // Find listings owned by main user
    const mainUserListings = await Listing.find({ owner_id: mainUser._id });
    if (mainUserListings.length === 0) {
      console.error('❌ No listings found for skiswap@gmail.com. Please run populateListings.js first.');
      return;
    }
    console.log(`✓ Found ${mainUserListings.length} listings owned by ${mainUser.email}\n`);

    // Find other users who can be reviewers
    const otherUsers = await User.find({ _id: { $ne: mainUser._id } });
    if (otherUsers.length === 0) {
      console.error('❌ No other users found. Please run populateListings.js first.');
      return;
    }
    console.log(`✓ Found ${otherUsers.length} other users to act as reviewers\n`);

    // Get listings from main user
    const listingIds = mainUserListings.map(listing => listing._id);

    // Find or create bookings for main user's listings
    let existingBookings = await Booking.find({ listing_id: { $in: listingIds } });
    console.log(`✓ Found ${existingBookings.length} existing bookings for main user's listings\n`);

    // Helper function to get date with offset
    const getDate = (daysOffset) => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date;
    };

    // Helper function to calculate booking price
    const calculateBookingPrice = (dailyRate, startDate, endDate, withInsurance = false) => {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      let price = dailyRate * days;
      if (withInsurance) {
        price += price * 0.15; // 15% insurance fee
      }
      return Math.round(price * 100) / 100;
    };

    // Helper function to get random element from array
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Create additional bookings if needed (we need at least 10 completed bookings to create 10 reviews)
    const bookingsNeeded = 10 - existingBookings.length;
    if (bookingsNeeded > 0) {
      console.log(`Creating ${bookingsNeeded} additional bookings...\n`);

      for (let i = 0; i < bookingsNeeded; i++) {
        const listing = getRandom(mainUserListings);
        const renter = getRandom(otherUsers);

        // Create a completed booking in the past
        const booking = new Booking({
          renter_id: renter._id,
          listing_id: listing._id,
          start_date: getDate(-30 - (i * 5)),
          end_date: getDate(-23 - (i * 5)),
          insurance_flag: Math.random() > 0.5,
          total_price: calculateBookingPrice(listing.daily_rate, getDate(-30 - (i * 5)), getDate(-23 - (i * 5)), Math.random() > 0.5)
        });
        await booking.save();
        existingBookings.push(booking);
        console.log(`✓ Created booking #${i + 1} for ${listing.title} (Renter: ${renter.nickname})`);
      }
      console.log('');
    }

    // Now create 10 reviews for the main user
    console.log('Creating 10 reviews for skiswap@gmail.com...\n');

    let reviewsCreated = 0;
    const ratings = [5, 5, 5, 4, 5, 4, 5, 4, 3, 5]; // Mix of ratings with mostly high ratings

    for (let i = 0; i < 10 && i < existingBookings.length; i++) {
      const booking = existingBookings[i];

      // Populate the booking to get renter details
      await booking.populate('renter_id');
      await booking.populate('listing_id');

      const review = new Review({
        booking_id: booking._id,
        renter_id: booking.renter_id._id,
        owner_id: mainUser._id,
        rating: ratings[i],
        comment: reviewComments[i],
        review_type: 'renter_to_owner',
        listing_id: booking.listing_id._id
      });

      await review.save();
      reviewsCreated++;
      console.log(`✓ Review #${reviewsCreated}: ${ratings[i]} stars from ${booking.renter_id.nickname}`);
    }

    console.log('\n✅ Reviews population completed!');
    console.log(`Total reviews created: ${reviewsCreated}`);
    console.log(`Average rating: ${(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)} stars`);

  } catch (error) {
    console.error('Error populating reviews:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
connectDB().then(() => {
  populateReviews();
});
