require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Listing = require('../models/Listing');

// Status scenarios to distribute across 20 bookings
const STATUS_SCENARIOS = [
  // Basic states
  'PENDING', 'PENDING',
  'ACCEPTED', 'ACCEPTED',

  // PICKUP phase - different orders
  'PICKUP',
  'PICKUP_OWNER',
  'PICKUP_RENTER',
  'IN_PROGRESS_RENTER_FIRST',  // Renter confirmed first
  'IN_PROGRESS_OWNER_FIRST',   // Owner confirmed first
  'IN_PROGRESS',

  // RETURN phase - different orders
  'RETURN',
  'RETURN_OWNER',
  'RETURN_RENTER',
  'COMPLETED_FROM_OWNER',      // Owner verified from RETURN_OWNER
  'COMPLETED_FROM_RENTER',     // Owner verified from RETURN_RENTER
  'COMPLETED',

  // Post-completion
  'REVIEWED', 'REVIEWED',

  // Cancellations
  'CANCELLED',
  'DECLINED'
];

// Helper: Generate date ranges based on status
function generateDateRange(status) {
  const now = new Date();
  let start_date, end_date;

  switch (status) {
    case 'PENDING':
    case 'DECLINED':
      // Future booking
      start_date = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days future
      end_date = new Date(start_date.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days rental
      break;

    case 'ACCEPTED':
      // Near future (2 days away)
      start_date = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      end_date = new Date(start_date.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;

    case 'PICKUP':
      // Today is pickup day
      start_date = new Date(now);
      start_date.setHours(0, 0, 0, 0);
      end_date = new Date(start_date.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;

    case 'IN_PROGRESS':
    case 'IN_PROGRESS_RENTER_FIRST':
    case 'IN_PROGRESS_OWNER_FIRST':
      // Started 2 days ago, ends in 5 days
      start_date = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      end_date = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      break;

    case 'RETURN':
      // Started 7 days ago, ends in 2 days
      start_date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end_date = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      break;

    case 'PICKUP_OWNER':
    case 'PICKUP_RENTER':
      // Today is pickup day, partial handoff confirmation
      start_date = new Date(now);
      start_date.setHours(0, 0, 0, 0);
      end_date = new Date(start_date.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;

    case 'RETURN_OWNER':
    case 'RETURN_RENTER':
      // Ended yesterday, partial return confirmation
      start_date = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      end_date = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      break;

    case 'COMPLETED':
    case 'COMPLETED_FROM_OWNER':
    case 'COMPLETED_FROM_RENTER':
    case 'REVIEWED':
      // Ended 5 days ago
      start_date = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000);
      end_date = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      break;

    case 'CANCELLED':
      // Was supposed to start tomorrow
      start_date = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      end_date = new Date(start_date.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;

    default:
      start_date = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      end_date = new Date(start_date.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return { start_date, end_date };
}

// Helper: Create status history for a booking
async function createStatusHistory(bookingId, targetStatus, renterId, ownerId) {
  const statusProgression = {
    'PENDING': ['PENDING'],
    'ACCEPTED': ['PENDING', 'ACCEPTED'],
    'PICKUP': ['PENDING', 'ACCEPTED', 'PICKUP'],
    'PICKUP_OWNER': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER'],
    'PICKUP_RENTER': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_RENTER'],

    // Two different paths to IN_PROGRESS
    'IN_PROGRESS_RENTER_FIRST': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_RENTER', 'IN_PROGRESS'],
    'IN_PROGRESS_OWNER_FIRST': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS'],
    'IN_PROGRESS': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS'],

    'RETURN': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN'],
    'RETURN_OWNER': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER'],
    'RETURN_RENTER': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_RENTER'],

    // Two different paths to COMPLETED
    'COMPLETED_FROM_OWNER': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'COMPLETED'],
    'COMPLETED_FROM_RENTER': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_RENTER', 'COMPLETED'],
    'COMPLETED': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'COMPLETED'],

    'REVIEWED': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'COMPLETED', 'REVIEWED'],
    'DECLINED': ['PENDING', 'DECLINED'],
    'CANCELLED': ['PENDING', 'CANCELLED'],
    'DISPUTED': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'DISPUTED'],
    'DISPUTE_RESOLVED': ['PENDING', 'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'DISPUTED', 'DISPUTE_RESOLVED']
  };

  const statuses = statusProgression[targetStatus] || ['PENDING'];
  const baseTime = new Date();

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    let changed_by = 'system';
    let changed_by_user_id = null;
    let notes = '';

    // Determine who changed the status
    if (status === 'PENDING') {
      changed_by = 'renter';
      changed_by_user_id = renterId;
      notes = 'Booking created';
    } else if (status === 'ACCEPTED') {
      changed_by = 'owner';
      changed_by_user_id = ownerId;
      notes = 'Owner accepted the booking';
    } else if (status === 'DECLINED') {
      changed_by = 'owner';
      changed_by_user_id = ownerId;
      notes = 'Owner declined the booking';
    } else if (status === 'CANCELLED') {
      changed_by = 'renter';
      changed_by_user_id = renterId;
      notes = 'Booking cancelled by renter';
    } else if (status === 'PICKUP') {
      changed_by = 'system';
      notes = 'Automatic transition to PICKUP on start date';
    } else if (status === 'IN_PROGRESS') {
      // Check previous status to determine who confirmed last
      const prevStatus = statuses[i - 1];
      if (prevStatus === 'PICKUP_OWNER') {
        changed_by = 'renter';
        changed_by_user_id = renterId;
        notes = 'Renter confirmed pickup (after owner)';
      } else if (prevStatus === 'PICKUP_RENTER') {
        changed_by = 'owner';
        changed_by_user_id = ownerId;
        notes = 'Owner confirmed handoff (after renter)';
      } else {
        // Fallback for simplified test data
        changed_by = 'system';
        notes = 'Both parties confirmed pickup';
      }
    } else if (status === 'PICKUP_OWNER') {
      changed_by = 'owner';
      changed_by_user_id = ownerId;
      notes = 'Owner confirmed handoff';
    } else if (status === 'PICKUP_RENTER') {
      changed_by = 'renter';
      changed_by_user_id = renterId;
      notes = 'Renter confirmed pickup';
    } else if (status === 'RETURN') {
      changed_by = 'system';
      notes = 'Automatic transition to RETURN (1 day before end date)';
    } else if (status === 'RETURN_OWNER') {
      changed_by = 'owner';
      changed_by_user_id = ownerId;
      notes = 'Owner confirmed equipment returned';
    } else if (status === 'RETURN_RENTER') {
      changed_by = 'renter';
      changed_by_user_id = renterId;
      notes = 'Renter confirmed return';
    } else if (status === 'COMPLETED') {
      changed_by = 'owner';
      changed_by_user_id = ownerId;
      notes = 'Owner verified equipment condition';
    } else if (status === 'REVIEWED') {
      changed_by = 'renter';
      changed_by_user_id = renterId;
      notes = 'Review submitted';
    } else if (status === 'DISPUTED') {
      changed_by = 'owner';
      changed_by_user_id = ownerId;
      notes = 'Owner opened dispute';
    } else if (status === 'DISPUTE_RESOLVED') {
      changed_by = 'system';
      notes = 'Dispute resolved by admin';
    }

    const statusEntry = new BookingStatus({
      booking_id: bookingId,
      status: status,
      changed_by: changed_by,
      changed_by_user_id: changed_by_user_id,
      notes: notes,
      createdAt: new Date(baseTime.getTime() + i * 60000) // 1 minute apart
    });

    await statusEntry.save();
  }
}

// Helper: Create payment for booking
async function createPayment(bookingId, renterId, amount, targetStatus) {
  // Only create payment if booking reached beyond ACCEPTED (payment required for all statuses except PENDING, ACCEPTED, DECLINED, CANCELLED)
  const paymentNotRequired = ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(targetStatus);

  if (paymentNotRequired) {
    return null;
  }

  // Calculate fees (15% platform fee)
  const skiswap_fee = Math.round(amount * 0.15 * 100) / 100;

  const payment = new Payment({
    payment_id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    booking_id: bookingId,
    payer_id: renterId,
    amount: amount,
    insurance_amount: 0,
    skiswap_fee: skiswap_fee,
    currency: 'EUR',
    payment_status: 'completed'
  });

  await payment.save();
  return payment._id;
}

async function populateBookings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user (skiswap@gmail.com)
    const testUser = await User.findOne({ email: 'skiswap@gmail.com' });
    if (!testUser) {
      console.error('Test user (skiswap@gmail.com) not found!');
      process.exit(1);
    }
    console.log(`Found test user: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`);

    // Find other users (not test user)
    const otherUsers = await User.find({
      email: { $ne: 'skiswap@gmail.com' }
    }).limit(30);

    if (otherUsers.length < 20) {
      console.error('Not enough other users in database (need at least 20)');
      process.exit(1);
    }
    console.log(`Found ${otherUsers.length} other users`);

    // Find listings owned by test user
    const testUserListings = await Listing.find({ owner_id: testUser._id }).limit(20);
    if (testUserListings.length < 20) {
      console.error(`Test user needs at least 20 listings (found ${testUserListings.length})`);
      console.error('Please run: node scripts/populateListings.js');
      process.exit(1);
    }
    console.log(`Found ${testUserListings.length} listings owned by test user`);

    // Find listings owned by other users
    const otherListings = await Listing.find({
      owner_id: { $ne: testUser._id }
    }).limit(20);

    if (otherListings.length < 20) {
      console.error(`Not enough listings from other users (found ${otherListings.length}, need 20)`);
      process.exit(1);
    }
    console.log(`Found ${otherListings.length} listings from other users`);

    // Delete all existing bookings, statuses, and payments
    console.log('\nDeleting all existing bookings, statuses, and payments...');
    await BookingStatus.deleteMany({});
    console.log('Deleted all BookingStatus records');
    await Payment.deleteMany({});
    console.log('Deleted all Payment records');
    await Booking.deleteMany({});
    console.log('Deleted all Booking records');

    // Create 20 bookings where test user is OWNER
    console.log('\n=== Creating 20 bookings where test user is OWNER ===');

    for (let i = 0; i < 20; i++) {
      const renter = otherUsers[i];
      const listing = testUserListings[i];
      const targetStatus = STATUS_SCENARIOS[i];
      const { start_date, end_date } = generateDateRange(targetStatus);

      // Calculate total price
      const days = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24));
      const total_price = listing.daily_rate * days;

      // Normalize status for booking (map test variants to actual status)
      let normalizedStatus = targetStatus;
      if (targetStatus.startsWith('IN_PROGRESS_')) normalizedStatus = 'IN_PROGRESS';
      if (targetStatus.startsWith('COMPLETED_')) normalizedStatus = 'COMPLETED';

      // Determine if payment is confirmed (all states beyond ACCEPTED except DECLINED/CANCELLED)
      const paymentConfirmed = !['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(normalizedStatus);

      // Create booking
      const booking = new Booking({
        listing_id: listing._id,
        renter_id: renter._id,
        owner_id: testUser._id,
        start_date: start_date,
        end_date: end_date,
        total_price: total_price,
        current_status: normalizedStatus,
        payment_confirmed: paymentConfirmed
      });
      await booking.save();

      // Create status history
      await createStatusHistory(booking._id, targetStatus, renter._id, testUser._id);

      // Create payment if needed
      await createPayment(booking._id, renter._id, total_price, targetStatus);

      console.log(`  [${i + 1}/20] Created booking: ${targetStatus} - Renter: ${renter.first_name} ${renter.last_name}`);
    }

    // Create 20 bookings where test user is RENTER
    console.log('\n=== Creating 20 bookings where test user is RENTER ===');
    for (let i = 0; i < 20; i++) {
      const owner = otherUsers[i];
      const listing = otherListings[i];
      const targetStatus = STATUS_SCENARIOS[i];
      const { start_date, end_date } = generateDateRange(targetStatus);

      // Calculate total price
      const days = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24));
      const total_price = listing.daily_rate * days;

      // Normalize status for booking (map test variants to actual status)
      let normalizedStatus = targetStatus;
      if (targetStatus.startsWith('IN_PROGRESS_')) normalizedStatus = 'IN_PROGRESS';
      if (targetStatus.startsWith('COMPLETED_')) normalizedStatus = 'COMPLETED';

      // Determine if payment is confirmed (all states beyond ACCEPTED except DECLINED/CANCELLED)
      const paymentConfirmed = !['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'].includes(normalizedStatus);

      // Create booking
      const booking = new Booking({
        listing_id: listing._id,
        renter_id: testUser._id,
        owner_id: owner._id,
        start_date: start_date,
        end_date: end_date,
        total_price: total_price,
        current_status: normalizedStatus,
        payment_confirmed: paymentConfirmed
      });
      await booking.save();

      // Create status history
      await createStatusHistory(booking._id, targetStatus, testUser._id, owner._id);

      // Create payment if needed
      await createPayment(booking._id, testUser._id, total_price, targetStatus);

      console.log(`  [${i + 1}/20] Created booking: ${targetStatus} - Owner: ${owner.first_name} ${owner.last_name}`);
    }

    // Summary
    const totalBookings = await Booking.countDocuments();
    const totalStatuses = await BookingStatus.countDocuments();
    const totalPayments = await Payment.countDocuments();

    console.log('\n=== Summary ===');
    console.log(`Total Bookings created: ${totalBookings}`);
    console.log(`Total BookingStatus records: ${totalStatuses}`);
    console.log(`Total Payment records: ${totalPayments}`);
    console.log('\nStatus distribution:');
    for (const status of [...new Set(STATUS_SCENARIOS)]) {
      const count = await Booking.countDocuments({ current_status: status });
      console.log(`  ${status}: ${count} bookings`);
    }

    console.log('\n✅ Database population completed successfully!');

  } catch (error) {
    console.error('Error populating bookings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
populateBookings();
