require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const BookingMessage = require('../models/BookingMessage');

async function deleteAllBookings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count existing records before deletion
    const bookingsCount = await Booking.countDocuments();
    const statusesCount = await BookingStatus.countDocuments();
    const paymentsCount = await Payment.countDocuments();
    const messagesCount = await BookingMessage.countDocuments();

    console.log('\n=== Current database state ===');
    console.log(`Bookings: ${bookingsCount}`);
    console.log(`Booking Statuses: ${statusesCount}`);
    console.log(`Payments: ${paymentsCount}`);
    console.log(`Booking Messages: ${messagesCount}`);

    const totalRecords = bookingsCount + statusesCount + paymentsCount + messagesCount;

    if (totalRecords === 0) {
      console.log('\nNo booking data found to delete.');
      return;
    }

    console.log(`\nTotal records to delete: ${totalRecords}`);
    console.log('\nDeleting all booking-related data...');

    // Delete all booking messages first (references bookings)
    const messagesResult = await BookingMessage.deleteMany({});
    console.log(`✓ Deleted ${messagesResult.deletedCount} booking messages`);

    // Delete all booking statuses (references bookings)
    const statusesResult = await BookingStatus.deleteMany({});
    console.log(`✓ Deleted ${statusesResult.deletedCount} booking statuses`);

    // Delete all payments (references bookings)
    const paymentsResult = await Payment.deleteMany({});
    console.log(`✓ Deleted ${paymentsResult.deletedCount} payments`);

    // Delete all bookings (main table)
    const bookingsResult = await Booking.deleteMany({});
    console.log(`✓ Deleted ${bookingsResult.deletedCount} bookings`);

    const totalDeleted = messagesResult.deletedCount + statusesResult.deletedCount +
                        paymentsResult.deletedCount + bookingsResult.deletedCount;

    console.log('\n=== Summary ===');
    console.log(`✅ Successfully deleted ${totalDeleted} records`);
    console.log('All booking data has been cleared from the database.');
    console.log('Users and listings remain intact.');

  } catch (error) {
    console.error('Error deleting bookings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
deleteAllBookings();
