const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');

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
  return Math.round(price * 100) / 100; // Round to 2 decimals
};

const populateBookings = async () => {
  try {
    console.log('Starting bookings population...\n');

    // Find the main user
    const mainUser = await User.findOne({ email: 'skiswap@gmail.com' });
    if (!mainUser) {
      console.error('❌ User skiswap@gmail.com not found. Please run populateListings.js first.');
      return;
    }
    console.log(`✓ Found main user: ${mainUser.email}\n`);

    // Find listings owned by main user
    const mainUserListings = await Listing.find({ owner_id: mainUser._id }).populate('category_id');
    console.log(`✓ Found ${mainUserListings.length} listings owned by ${mainUser.email}\n`);

    // Find listings owned by others
    const otherListings = await Listing.find({ owner_id: { $ne: mainUser._id } }).populate('category_id owner_id');
    console.log(`✓ Found ${otherListings.length} listings owned by other users\n`);

    if (otherListings.length === 0) {
      console.error('❌ No listings found from other users. Please run populateListings.js first.');
      return;
    }

    // Get other users (renters for main user's listings)
    const otherUsers = await User.find({ _id: { $ne: mainUser._id } });
    if (otherUsers.length === 0) {
      console.error('❌ No other users found. Please run populateListings.js first.');
      return;
    }

    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    let bookingsCreated = 0;
    let statusesCreated = 0;
    let paymentsCreated = 0;

    console.log('Creating bookings where skiswap@gmail.com rents from others...\n');

    // 1. ACTIVE RENTAL - User is currently renting equipment
    const activeListing = otherListings[0];
    const activeBooking = new Booking({
      renter_id: mainUser._id,
      listing_id: activeListing._id,
      start_date: getDate(-5), // Started 5 days ago
      end_date: getDate(10), // Ends in 10 days
      insurance_flag: true,
      total_price: calculateBookingPrice(activeListing.daily_rate, getDate(-5), getDate(10), true)
    });
    await activeBooking.save();
    bookingsCreated++;
    console.log(`✓ Active: ${activeListing.title} (${activeListing.owner_id.nickname})`);

    const activeStatus = new BookingStatus({
      booking_id: activeBooking._id,
      status: 'ongoing',
      payment_flag: true,
      renter_pickup: true,
      owner_pickup: true
    });
    await activeStatus.save();
    statusesCreated++;

    const activePayment = new Payment({
      booking_id: activeBooking._id,
      payer_id: mainUser._id,
      amount: activeBooking.total_price,
      payment_method: 'credit_card',
      transaction_id: `txn_${Date.now()}_001`,
      payment_status: 'completed'
    });
    await activePayment.save();
    paymentsCreated++;

    // 2. ANOTHER ACTIVE RENTAL
    if (otherListings.length > 1) {
      const active2Listing = otherListings[1];
      const active2Booking = new Booking({
        renter_id: mainUser._id,
        listing_id: active2Listing._id,
        start_date: getDate(-3),
        end_date: getDate(7),
        insurance_flag: false,
        total_price: calculateBookingPrice(active2Listing.daily_rate, getDate(-3), getDate(7), false)
      });
      await active2Booking.save();
      bookingsCreated++;
      console.log(`✓ Active: ${active2Listing.title} (${active2Listing.owner_id.nickname})`);

      const active2Status = new BookingStatus({
        booking_id: active2Booking._id,
        status: 'ongoing',
        payment_flag: true,
        renter_pickup: true,
        owner_pickup: true
      });
      await active2Status.save();
      statusesCreated++;

      const active2Payment = new Payment({
        booking_id: active2Booking._id,
        payer_id: mainUser._id,
        amount: active2Booking.total_price,
        payment_method: 'paypal',
        transaction_id: `txn_${Date.now()}_002`,
        payment_status: 'completed'
      });
      await active2Payment.save();
      paymentsCreated++;
    }

    // 3. UPCOMING RENTAL - Confirmed and waiting for pickup
    if (otherListings.length > 2) {
      const upcomingListing = otherListings[2];
      const upcomingBooking = new Booking({
        renter_id: mainUser._id,
        listing_id: upcomingListing._id,
        start_date: getDate(5), // Starts in 5 days
        end_date: getDate(12), // Ends in 12 days
        insurance_flag: true,
        total_price: calculateBookingPrice(upcomingListing.daily_rate, getDate(5), getDate(12), true)
      });
      await upcomingBooking.save();
      bookingsCreated++;
      console.log(`✓ Upcoming: ${upcomingListing.title} (${upcomingListing.owner_id.nickname})`);

      const upcomingStatus = new BookingStatus({
        booking_id: upcomingBooking._id,
        status: 'confirmed',
        payment_flag: true
      });
      await upcomingStatus.save();
      statusesCreated++;

      const upcomingPayment = new Payment({
        booking_id: upcomingBooking._id,
        payer_id: mainUser._id,
        amount: upcomingBooking.total_price,
        payment_method: 'stripe',
        transaction_id: `txn_${Date.now()}_003`,
        payment_status: 'completed'
      });
      await upcomingPayment.save();
      paymentsCreated++;
    }

    // 4. ANOTHER UPCOMING RENTAL - Still pending
    if (otherListings.length > 3) {
      const upcoming2Listing = otherListings[3];
      const upcoming2Booking = new Booking({
        renter_id: mainUser._id,
        listing_id: upcoming2Listing._id,
        start_date: getDate(15),
        end_date: getDate(22),
        insurance_flag: false,
        total_price: calculateBookingPrice(upcoming2Listing.daily_rate, getDate(15), getDate(22), false)
      });
      await upcoming2Booking.save();
      bookingsCreated++;
      console.log(`✓ Upcoming: ${upcoming2Listing.title} (${upcoming2Listing.owner_id.nickname})`);

      const upcoming2Status = new BookingStatus({
        booking_id: upcoming2Booking._id,
        status: 'pending',
        payment_flag: false
      });
      await upcoming2Status.save();
      statusesCreated++;
    }

    // 5. COMPLETED RENTAL - Past booking
    if (otherListings.length > 4) {
      const completedListing = otherListings[4];
      const completedBooking = new Booking({
        renter_id: mainUser._id,
        listing_id: completedListing._id,
        start_date: getDate(-20), // Started 20 days ago
        end_date: getDate(-13), // Ended 13 days ago
        insurance_flag: true,
        total_price: calculateBookingPrice(completedListing.daily_rate, getDate(-20), getDate(-13), true)
      });
      await completedBooking.save();
      bookingsCreated++;
      console.log(`✓ Completed: ${completedListing.title} (${completedListing.owner_id.nickname})`);

      const completedStatus = new BookingStatus({
        booking_id: completedBooking._id,
        status: 'completed',
        payment_flag: true,
        renter_pickup: true,
        owner_pickup: true,
        renter_return: true,
        owner_return: true
      });
      await completedStatus.save();
      statusesCreated++;

      const completedPayment = new Payment({
        booking_id: completedBooking._id,
        payer_id: mainUser._id,
        amount: completedBooking.total_price,
        payment_method: 'credit_card',
        transaction_id: `txn_${Date.now()}_004`,
        payment_status: 'completed'
      });
      await completedPayment.save();
      paymentsCreated++;
    }

    // 6. ANOTHER COMPLETED RENTAL
    if (otherListings.length > 5) {
      const completed2Listing = otherListings[5];
      const completed2Booking = new Booking({
        renter_id: mainUser._id,
        listing_id: completed2Listing._id,
        start_date: getDate(-35),
        end_date: getDate(-28),
        insurance_flag: false,
        total_price: calculateBookingPrice(completed2Listing.daily_rate, getDate(-35), getDate(-28), false)
      });
      await completed2Booking.save();
      bookingsCreated++;
      console.log(`✓ Completed: ${completed2Listing.title} (${completed2Listing.owner_id.nickname})`);

      const completed2Status = new BookingStatus({
        booking_id: completed2Booking._id,
        status: 'completed',
        payment_flag: true,
        renter_pickup: true,
        owner_pickup: true,
        renter_return: true,
        owner_return: true
      });
      await completed2Status.save();
      statusesCreated++;

      const completed2Payment = new Payment({
        booking_id: completed2Booking._id,
        payer_id: mainUser._id,
        amount: completed2Booking.total_price,
        payment_method: 'paypal',
        transaction_id: `txn_${Date.now()}_005`,
        payment_status: 'completed'
      });
      await completed2Payment.save();
      paymentsCreated++;
    }

    console.log('\nCreating bookings where others rent from skiswap@gmail.com...\n');

    // 7. PENDING REQUEST - Someone wants to rent from main user
    if (mainUserListings.length > 0) {
      const pendingListing = mainUserListings[0];
      const renter = getRandom(otherUsers);
      const pendingBooking = new Booking({
        renter_id: renter._id,
        listing_id: pendingListing._id,
        start_date: getDate(7),
        end_date: getDate(14),
        insurance_flag: true,
        total_price: calculateBookingPrice(pendingListing.daily_rate, getDate(7), getDate(14), true)
      });
      await pendingBooking.save();
      bookingsCreated++;
      console.log(`✓ Pending Request: ${pendingListing.title} (Renter: ${renter.nickname})`);

      const pendingStatus = new BookingStatus({
        booking_id: pendingBooking._id,
        status: 'pending',
        payment_flag: false
      });
      await pendingStatus.save();
      statusesCreated++;
    }

    // 8. ANOTHER PENDING REQUEST
    if (mainUserListings.length > 1) {
      const pending2Listing = mainUserListings[1];
      const renter2 = getRandom(otherUsers);
      const pending2Booking = new Booking({
        renter_id: renter2._id,
        listing_id: pending2Listing._id,
        start_date: getDate(10),
        end_date: getDate(17),
        insurance_flag: false,
        total_price: calculateBookingPrice(pending2Listing.daily_rate, getDate(10), getDate(17), false)
      });
      await pending2Booking.save();
      bookingsCreated++;
      console.log(`✓ Pending Request: ${pending2Listing.title} (Renter: ${renter2.nickname})`);

      const pending2Status = new BookingStatus({
        booking_id: pending2Booking._id,
        status: 'pending',
        payment_flag: false
      });
      await pending2Status.save();
      statusesCreated++;
    }

    // 9. ACTIVE BOOKING - Someone is currently renting from main user
    if (mainUserListings.length > 2) {
      const activeLendListing = mainUserListings[2];
      const renter3 = getRandom(otherUsers);
      const activeLendBooking = new Booking({
        renter_id: renter3._id,
        listing_id: activeLendListing._id,
        start_date: getDate(-4),
        end_date: getDate(8),
        insurance_flag: true,
        total_price: calculateBookingPrice(activeLendListing.daily_rate, getDate(-4), getDate(8), true)
      });
      await activeLendBooking.save();
      bookingsCreated++;
      console.log(`✓ Active Booking: ${activeLendListing.title} (Renter: ${renter3.nickname})`);

      const activeLendStatus = new BookingStatus({
        booking_id: activeLendBooking._id,
        status: 'ongoing',
        payment_flag: true,
        renter_pickup: true,
        owner_pickup: true
      });
      await activeLendStatus.save();
      statusesCreated++;

      const activeLendPayment = new Payment({
        booking_id: activeLendBooking._id,
        payer_id: renter3._id,
        amount: activeLendBooking.total_price,
        payment_method: 'credit_card',
        transaction_id: `txn_${Date.now()}_006`,
        payment_status: 'completed'
      });
      await activeLendPayment.save();
      paymentsCreated++;
    }

    // 10. UPCOMING BOOKING - Confirmed rental from main user
    if (mainUserListings.length > 3) {
      const upcomingLendListing = mainUserListings[3];
      const renter4 = getRandom(otherUsers);
      const upcomingLendBooking = new Booking({
        renter_id: renter4._id,
        listing_id: upcomingLendListing._id,
        start_date: getDate(6),
        end_date: getDate(13),
        insurance_flag: false,
        total_price: calculateBookingPrice(upcomingLendListing.daily_rate, getDate(6), getDate(13), false)
      });
      await upcomingLendBooking.save();
      bookingsCreated++;
      console.log(`✓ Upcoming Booking: ${upcomingLendListing.title} (Renter: ${renter4.nickname})`);

      const upcomingLendStatus = new BookingStatus({
        booking_id: upcomingLendBooking._id,
        status: 'confirmed',
        payment_flag: true
      });
      await upcomingLendStatus.save();
      statusesCreated++;

      const upcomingLendPayment = new Payment({
        booking_id: upcomingLendBooking._id,
        payer_id: renter4._id,
        amount: upcomingLendBooking.total_price,
        payment_method: 'stripe',
        transaction_id: `txn_${Date.now()}_007`,
        payment_status: 'completed'
      });
      await upcomingLendPayment.save();
      paymentsCreated++;
    }

    // 11. COMPLETED BOOKING - Past rental from main user
    if (mainUserListings.length > 4) {
      const completedLendListing = mainUserListings[4];
      const renter5 = getRandom(otherUsers);
      const completedLendBooking = new Booking({
        renter_id: renter5._id,
        listing_id: completedLendListing._id,
        start_date: getDate(-25),
        end_date: getDate(-18),
        insurance_flag: true,
        total_price: calculateBookingPrice(completedLendListing.daily_rate, getDate(-25), getDate(-18), true)
      });
      await completedLendBooking.save();
      bookingsCreated++;
      console.log(`✓ Completed Booking: ${completedLendListing.title} (Renter: ${renter5.nickname})`);

      const completedLendStatus = new BookingStatus({
        booking_id: completedLendBooking._id,
        status: 'completed',
        payment_flag: true,
        renter_pickup: true,
        owner_pickup: true,
        renter_return: true,
        owner_return: true
      });
      await completedLendStatus.save();
      statusesCreated++;

      const completedLendPayment = new Payment({
        booking_id: completedLendBooking._id,
        payer_id: renter5._id,
        amount: completedLendBooking.total_price,
        payment_method: 'credit_card',
        transaction_id: `txn_${Date.now()}_008`,
        payment_status: 'completed'
      });
      await completedLendPayment.save();
      paymentsCreated++;
    }

    // 12. ANOTHER COMPLETED BOOKING
    if (mainUserListings.length > 5) {
      const completed2LendListing = mainUserListings[5];
      const renter6 = getRandom(otherUsers);
      const completed2LendBooking = new Booking({
        renter_id: renter6._id,
        listing_id: completed2LendListing._id,
        start_date: getDate(-40),
        end_date: getDate(-33),
        insurance_flag: false,
        total_price: calculateBookingPrice(completed2LendListing.daily_rate, getDate(-40), getDate(-33), false)
      });
      await completed2LendBooking.save();
      bookingsCreated++;
      console.log(`✓ Completed Booking: ${completed2LendListing.title} (Renter: ${renter6.nickname})`);

      const completed2LendStatus = new BookingStatus({
        booking_id: completed2LendBooking._id,
        status: 'completed',
        payment_flag: true,
        renter_pickup: true,
        owner_pickup: true,
        renter_return: true,
        owner_return: true
      });
      await completed2LendStatus.save();
      statusesCreated++;

      const completed2LendPayment = new Payment({
        booking_id: completed2LendBooking._id,
        payer_id: renter6._id,
        amount: completed2LendBooking.total_price,
        payment_method: 'paypal',
        transaction_id: `txn_${Date.now()}_009`,
        payment_status: 'completed'
      });
      await completed2LendPayment.save();
      paymentsCreated++;
    }

    console.log('\n✅ Bookings population completed!');
    console.log(`Total bookings created: ${bookingsCreated}`);
    console.log(`Total booking statuses created: ${statusesCreated}`);
    console.log(`Total payments created: ${paymentsCreated}`);
    console.log('\nSummary:');
    console.log(`- Bookings where skiswap@gmail.com rents from others: ~6`);
    console.log(`- Bookings where others rent from skiswap@gmail.com: ~6`);
    console.log(`- Statuses: pending, confirmed, ongoing, completed`);

  } catch (error) {
    console.error('Error populating bookings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
connectDB().then(() => {
  populateBookings();
});
