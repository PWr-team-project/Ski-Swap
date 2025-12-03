// Run this script once to fix the payment_id index issue
// Usage: node fix-payment-index.js

const mongoose = require('mongoose');
require('dotenv').config();

async function fixPaymentIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');

    // Drop the old payment_id index
    try {
      await paymentsCollection.dropIndex('payment_id_1');
      console.log('✓ Dropped old payment_id index');
    } catch (err) {
      if (err.code === 27) {
        console.log('Index payment_id_1 does not exist, skipping drop');
      } else {
        throw err;
      }
    }

    // Create new sparse unique index
    await paymentsCollection.createIndex(
      { payment_id: 1 },
      { unique: true, sparse: true }
    );
    console.log('✓ Created new sparse unique index on payment_id');

    console.log('\n✅ Payment index fixed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing payment index:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixPaymentIndex();
