require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');

// New categories with realistic pricing
const categories = [
  {
    name: 'Skis',
    description: 'Alpine skis, touring skis, and all-mountain skis for various skill levels and snow conditions',
    suggested_price_daily: 35,
    suggested_price_weekly: 200,
    suggested_price_monthly: 600
  },
  {
    name: 'Skiing shoes',
    description: 'Ski boots for alpine, touring, and backcountry skiing with proper support and comfort',
    suggested_price_daily: 20,
    suggested_price_weekly: 120,
    suggested_price_monthly: 350
  },
  {
    name: 'Snowboarding shoes',
    description: 'Snowboard boots with various flex ratings for freestyle, all-mountain, and freeride riding',
    suggested_price_daily: 18,
    suggested_price_weekly: 110,
    suggested_price_monthly: 320
  },
  {
    name: 'Snowboards',
    description: 'Snowboards for all riding styles including freestyle, all-mountain, powder, and park',
    suggested_price_daily: 30,
    suggested_price_weekly: 180,
    suggested_price_monthly: 550
  },
  {
    name: 'Clothing',
    description: 'Winter sports apparel including jackets, pants, base layers, gloves, and thermal wear',
    suggested_price_daily: 15,
    suggested_price_weekly: 85,
    suggested_price_monthly: 250
  },
  {
    name: 'Accessories',
    description: 'Goggles, helmets, gloves, backpacks, poles, and other winter sports accessories',
    suggested_price_daily: 10,
    suggested_price_weekly: 55,
    suggested_price_monthly: 150
  },
  {
    name: 'For kids',
    description: 'Kids-sized skis, snowboards, boots, helmets, and winter sports gear for young riders',
    suggested_price_daily: 12,
    suggested_price_weekly: 70,
    suggested_price_monthly: 200
  }
];

async function populateCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete all existing categories
    console.log('Deleting existing categories...');
    const deleteResult = await Category.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing categories\n`);

    // Insert new categories
    console.log('Creating new categories...\n');

    for (let i = 0; i < categories.length; i++) {
      const categoryData = categories[i];
      const category = new Category(categoryData);
      await category.save();

      console.log(`  [${i + 1}/${categories.length}] Created: ${categoryData.name}`);
      console.log(`    Daily: $${categoryData.suggested_price_daily} | Weekly: $${categoryData.suggested_price_weekly} | Monthly: $${categoryData.suggested_price_monthly}`);
    }

    // Summary
    const totalCategories = await Category.countDocuments();

    console.log('\n=== Summary ===');
    console.log(`Total Categories: ${totalCategories}`);
    console.log('\nCategories in database:');

    const allCategories = await Category.find({}).sort({ name: 1 });
    allCategories.forEach(cat => {
      console.log(`  • ${cat.name} (Daily: $${cat.suggested_price_daily})`);
    });

    console.log('\n✅ Category population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating categories:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
populateCategories();
