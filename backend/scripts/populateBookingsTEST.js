require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const BookingMessage = require('../models/BookingMessage');
const User = require('../models/User');
const Listing = require('../models/Listing');

// Status scenarios to test between Ski Swapper and panpatlyk
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

// Helper: Create status history for a booking WITH chat messages
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
    const prevStatus = i > 0 ? statuses[i - 1] : null;
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

    const statusTimestamp = new Date(baseTime.getTime() + i * 60000); // 1 minute apart

    // Create BookingStatus entry
    const statusEntry = new BookingStatus({
      booking_id: bookingId,
      status: status,
      changed_by: changed_by,
      changed_by_user_id: changed_by_user_id,
      notes: notes,
      createdAt: statusTimestamp
    });

    await statusEntry.save();

    // Create corresponding BookingMessage for status change (visible in chat)
    if (prevStatus) {
      await BookingMessage.create({
        booking_id: bookingId,
        sender_id: null, // System message
        message_type: 'status_change',
        message_text: `Booking status changed from ${prevStatus} to ${status}`,
        status_change: {
          from_status: prevStatus,
          to_status: status
        },
        sent_at: statusTimestamp
      });
    }
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

async function populateBookingsTEST() {
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

    // Find listings owned by Ski Swapper
    const skiSwapperListings = await Listing.find({ owner_id: skiSwapper._id }).limit(20);
    if (skiSwapperListings.length < 20) {
      console.error(`Ski Swapper needs at least 20 listings (found ${skiSwapperListings.length})`);
      console.error('Please run: node scripts/populateListings.js');
      process.exit(1);
    }
    console.log(`Found ${skiSwapperListings.length} listings owned by Ski Swapper`);

    // Delete all existing bookings, statuses, payments, and booking messages
    console.log('\nDeleting all existing bookings, statuses, payments, and messages...');
    await BookingMessage.deleteMany({});
    console.log('Deleted all BookingMessage records');
    await BookingStatus.deleteMany({});
    console.log('Deleted all BookingStatus records');
    await Payment.deleteMany({});
    console.log('Deleted all Payment records');
    await Booking.deleteMany({});
    console.log('Deleted all Booking records');

    // Create 20 bookings where Ski Swapper is OWNER and panpatlyk is RENTER
    console.log('\n=== Creating 20 bookings where Ski Swapper is OWNER and panpatlyk is RENTER ===');

    for (let i = 0; i < 20; i++) {
      const listing = skiSwapperListings[i];
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
        renter_id: panpatlyk._id,
        owner_id: skiSwapper._id,
        start_date: start_date,
        end_date: end_date,
        total_price: total_price,
        current_status: normalizedStatus,
        payment_confirmed: paymentConfirmed
      });
      await booking.save();

      // Create status history WITH chat messages
      await createStatusHistory(booking._id, targetStatus, panpatlyk._id, skiSwapper._id);

      // Create payment if needed
      await createPayment(booking._id, panpatlyk._id, total_price, targetStatus);

      console.log(`  [${i + 1}/20] Created booking: ${targetStatus} - Owner: Ski Swapper, Renter: panpatlyk`);
    }

    // Summary
    const totalBookings = await Booking.countDocuments();
    const totalStatuses = await BookingStatus.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalMessages = await BookingMessage.countDocuments();

    console.log('\n=== Summary ===');
    console.log(`Total Bookings created: ${totalBookings}`);
    console.log(`Total BookingStatus records: ${totalStatuses}`);
    console.log(`Total Payment records: ${totalPayments}`);
    console.log(`Total BookingMessage records (status changes): ${totalMessages}`);
    console.log('\nStatus distribution:');
    for (const status of [...new Set(STATUS_SCENARIOS)]) {
      const count = await Booking.countDocuments({ current_status: status });
      console.log(`  ${status}: ${count} bookings`);
    }

    console.log('\n✅ TEST Database population completed successfully!');
    console.log('All bookings are between:');
    console.log(`  - Owner: ${skiSwapper.first_name} ${skiSwapper.last_name} (${skiSwapper.email})`);
    console.log(`  - Renter: ${panpatlyk.first_name} ${panpatlyk.last_name} (${panpatlyk.email})`);
    console.log('\nStatus changes are now visible in booking detail chat!');

  } catch (error) {
    console.error('Error populating test bookings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
populateBookingsTEST();
