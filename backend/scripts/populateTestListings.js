require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Listing = require('../models/Listing');

// Path to photos directory
const PHOTOS_DIR = 'C:\\Users\\HP\\OneDrive\\Pulpit\\listingPhotos';

// Test users
const TEST_USER_EMAILS = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com',
  'company1@example.com',
  'company2@example.com',
  'company3@example.com'
];

// Conditions
const CONDITIONS = ['new', 'like new', 'good', 'fair', 'used'];

// Equipment data templates
const EQUIPMENT_DATA = {
  'Skis': [
    { brand: 'K2', model: 'Mindbender 99Ti', sizes: ['170cm', '177cm', '180cm', '184cm'] },
    { brand: 'Rossignol', model: 'Experience 88 Ti', sizes: ['170cm', '177cm', '182cm', '188cm'] },
    { brand: 'Atomic', model: 'Maverick 95', sizes: ['175cm', '180cm', '185cm', '190cm'] },
    { brand: 'Salomon', model: 'QST 92', sizes: ['171cm', '178cm', '185cm', '192cm'] },
    { brand: 'Blizzard', model: 'Rustler 10', sizes: ['172cm', '180cm', '188cm'] },
    { brand: 'Fischer', model: 'Ranger 102 FR', sizes: ['175cm', '182cm', '189cm'] },
    { brand: 'Head', model: 'Kore 93', sizes: ['171cm', '179cm', '186cm'] },
    { brand: 'Volkl', model: 'Mantra M6', sizes: ['177cm', '184cm', '191cm'] },
    { brand: 'Nordica', model: 'Enforcer 100', sizes: ['179cm', '186cm', '193cm'] },
    { brand: 'Line', model: 'Sick Day 104', sizes: ['176cm', '183cm', '190cm'] }
  ],
  'Snowboards': [
    { brand: 'Burton', model: 'Custom X', sizes: ['154cm', '158cm', '162cm'] },
    { brand: 'Lib Tech', model: 'T.Rice Pro', sizes: ['157cm', '161cm', '165cm'] },
    { brand: 'Jones', model: 'Mountain Twin', sizes: ['154cm', '157cm', '161cm'] },
    { brand: 'Capita', model: 'DOA', sizes: ['152cm', '156cm', '158cm'] },
    { brand: 'Ride', model: 'Warpig', sizes: ['142cm', '148cm', '154cm'] },
    { brand: 'GNU', model: 'Riders Choice', sizes: ['155cm', '159cm', '163cm'] },
    { brand: 'Arbor', model: 'Formula', sizes: ['151cm', '155cm', '159cm'] },
    { brand: 'YES', model: 'Standard', sizes: ['150cm', '154cm', '158cm'] },
    { brand: 'Never Summer', model: 'Proto Type Two', sizes: ['154cm', '158cm', '162cm'] },
    { brand: 'K2', model: 'Manifest', sizes: ['153cm', '156cm', '159cm'] }
  ],
  'Skiing shoes': [
    { brand: 'Atomic', model: 'Hawx Ultra 130', sizes: ['25.5', '26.5', '27.5', '28.5'] },
    { brand: 'Salomon', model: 'S/PRO 120', sizes: ['25.5', '26.5', '27.5', '28.5'] },
    { brand: 'Rossignol', model: 'Alltrack Pro 120', sizes: ['26.0', '27.0', '28.0', '29.0'] },
    { brand: 'Tecnica', model: 'Mach1 MV 130', sizes: ['25.5', '26.5', '27.5', '28.5'] },
    { brand: 'Nordica', model: 'Speedmachine 130', sizes: ['26.0', '27.0', '28.0', '29.0'] },
    { brand: 'Head', model: 'Raptor WCR 130', sizes: ['25.5', '26.5', '27.5', '28.5'] },
    { brand: 'Fischer', model: 'RC Pro 130', sizes: ['26.0', '27.0', '28.0'] },
    { brand: 'Lange', model: 'RX 130', sizes: ['25.5', '26.5', '27.5', '28.5'] },
    { brand: 'Dalbello', model: 'Panterra 120', sizes: ['26.0', '27.0', '28.0', '29.0'] },
    { brand: 'K2', model: 'Recon 120', sizes: ['25.5', '26.5', '27.5', '28.5'] }
  ],
  'Snowboarding shoes': [
    { brand: 'Burton', model: 'Ion BOA', sizes: ['9', '10', '11', '12'] },
    { brand: 'ThirtyTwo', model: 'TM-2', sizes: ['9', '10', '11', '12'] },
    { brand: 'Salomon', model: 'Malamute', sizes: ['9', '10', '11', '12'] },
    { brand: 'Vans', model: 'Hi-Standard Pro', sizes: ['9', '10', '11', '12'] },
    { brand: 'DC', model: 'Judge BOA', sizes: ['9', '10', '11', '12'] },
    { brand: 'K2', model: 'Maysis', sizes: ['9', '10', '11', '12'] },
    { brand: 'Ride', model: 'Insano', sizes: ['9', '10', '11', '12'] },
    { brand: 'Nitro', model: 'Team TLS', sizes: ['9', '10', '11', '12'] },
    { brand: 'Adidas', model: 'Tactical ADV', sizes: ['9', '10', '11', '12'] },
    { brand: 'Rome', model: 'Bodega', sizes: ['9', '10', '11', '12'] }
  ],
  'Clothing': [
    { brand: 'Arc\'teryx', model: 'Rush Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Patagonia', model: 'Powder Bowl Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'The North Face', model: 'Apex Flex GTX', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Helly Hansen', model: 'Alpha 3.0 Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Columbia', model: 'Bugaboo II Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Spyder', model: 'Leader GTX Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Mammut', model: 'Nordwand Pro Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Black Diamond', model: 'Mission Down Parka', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Outdoor Research', model: 'Hemispheres Jacket', sizes: ['S', 'M', 'L', 'XL'] },
    { brand: 'Mountain Hardwear', model: 'FireFall/2 Jacket', sizes: ['S', 'M', 'L', 'XL'] }
  ],
  'Accessories': [
    { brand: 'Smith', model: 'I/O Mag Goggles', sizes: ['One Size'] },
    { brand: 'POC', model: 'Obex SPIN Helmet', sizes: ['M', 'L', 'XL'] },
    { brand: 'Black Diamond', model: 'Carbon Cork Poles', sizes: ['120cm', '125cm', '130cm'] },
    { brand: 'Dakine', model: 'Boot Locker 69L', sizes: ['One Size'] },
    { brand: 'Oakley', model: 'Flight Deck XM', sizes: ['One Size'] },
    { brand: 'Giro', model: 'Range MIPS Helmet', sizes: ['M', 'L', 'XL'] },
    { brand: 'Burton', model: 'AK 25L Backpack', sizes: ['One Size'] },
    { brand: 'Rossignol', model: 'Experience Pro Poles', sizes: ['115cm', '120cm', '125cm'] },
    { brand: 'Anon', model: 'M4 Goggles', sizes: ['One Size'] },
    { brand: 'Sweet Protection', model: 'Switcher MIPS', sizes: ['M', 'L', 'XL'] }
  ],
  'For kids': [
    { brand: 'Rossignol', model: 'Experience Pro Kids', sizes: ['110cm', '120cm', '130cm'] },
    { brand: 'Salomon', model: 'QST Max Jr', sizes: ['120cm', '130cm', '140cm'] },
    { brand: 'Head', model: 'Supershape Team', sizes: ['107cm', '117cm', '127cm'] },
    { brand: 'K2', model: 'Indy Kids Skis', sizes: ['112cm', '120cm', '128cm'] },
    { brand: 'Atomic', model: 'Redster J2 Kids', sizes: ['110cm', '120cm', '130cm'] },
    { brand: 'Burton', model: 'Chopper Kids Board', sizes: ['100cm', '110cm', '115cm'] },
    { brand: 'Salomon', model: 'Team Jr Boots', sizes: ['19.5', '20.5', '21.5', '22.5'] },
    { brand: 'Rossignol', model: 'Comp J3 Boots', sizes: ['19.5', '20.5', '21.5', '22.5'] },
    { brand: 'POC', model: 'POCito Helmet', sizes: ['XS', 'S', 'M'] },
    { brand: 'Smith', model: 'Gambler Youth Goggles', sizes: ['One Size'] }
  ]
};

// Helper to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate unique listing title
function generateUniqueTitle(equipment, categoryName, index) {
  const size = getRandom(equipment.sizes);
  return `${equipment.brand} ${equipment.model} ${size} - ${categoryName} #${index}`;
}

// Generate description
function generateDescription(equipment, categoryName, condition) {
  const descriptions = {
    'Skis': 'Perfect for all-mountain skiing. Well-maintained and ready for the slopes.',
    'Snowboards': 'Great for freestyle and all-mountain riding. Excellent condition.',
    'Skiing shoes': 'Comfortable ski boots with excellent support and performance.',
    'Snowboarding shoes': 'High-quality snowboard boots with great flex and response.',
    'Clothing': 'Premium winter sports apparel. Waterproof and breathable.',
    'Accessories': 'Essential winter sports accessory in great condition.',
    'For kids': 'Perfect for young riders. Safe, comfortable, and fun to use.'
  };

  return `${equipment.brand} ${equipment.model} - ${descriptions[categoryName] || 'Quality winter sports equipment.'} Condition: ${condition}. Available for rental now!`;
}

async function populateTestListings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get photo files
    console.log('📷 Reading photos from directory...');
    const photoFiles = fs.readdirSync(PHOTOS_DIR);
    if (photoFiles.length < 60) {
      throw new Error(`Expected 60 photos, found ${photoFiles.length}`);
    }
    console.log(`✅ Found ${photoFiles.length} photos\n`);

    // Get test users
    console.log('👥 Finding test users...');
    const users = [];
    for (const email of TEST_USER_EMAILS) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error(`User ${email} not found. Please run populateTestUsers.js first.`);
      }
      users.push(user);
      console.log(`   ✓ Found: ${user.nickname} (${user.email})`);
    }
    console.log('');

    // Get or create locations for each user
    console.log('📍 Setting up user locations...');
    const userLocations = {};
    for (const user of users) {
      // Check if user already has a location
      let location = user.location_id ? await Location.findById(user.location_id) : null;

      if (!location) {
        // Create a new location for this user
        location = new Location({
          city: 'Wroclaw',
          country: 'Poland',
          latitude: 51.1079,
          longitude: 17.0385
        });
        await location.save();

        // Update user with location
        user.location_id = location._id;
        await user.save();
        console.log(`   ✓ Created location for ${user.nickname}`);
      } else {
        console.log(`   ✓ Using existing location for ${user.nickname}: ${location.city}, ${location.country}`);
      }

      userLocations[user._id.toString()] = location;
    }
    console.log('');

    // Get categories
    console.log('📁 Loading categories...');
    const categories = await Category.find({});
    if (categories.length === 0) {
      throw new Error('No categories found. Please run populateCategories.js first.');
    }
    console.log(`✅ Found ${categories.length} categories\n`);

    // Create listings
    console.log('🔄 Creating 60 listings (10 per user)...\n');
    let photoIndex = 0;
    let listingsCreated = 0;

    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      const user = users[userIndex];
      const location = userLocations[user._id.toString()];

      console.log(`Creating listings for ${user.nickname}:`);

      for (let i = 0; i < 10; i++) {
        // Get photo for this listing
        const photoFilename = photoFiles[photoIndex];
        const photoPath = `/uploads/${photoFilename}`;
        photoIndex++;

        // Get random category
        const category = getRandom(categories);
        const categoryName = category.name;

        // Get equipment data for this category
        const equipmentList = EQUIPMENT_DATA[categoryName] || EQUIPMENT_DATA['Accessories'];
        const equipment = getRandom(equipmentList);

        // Generate listing data
        const condition = getRandom(CONDITIONS);
        const title = generateUniqueTitle(equipment, categoryName, listingsCreated + 1);
        const description = generateDescription(equipment, categoryName, condition);

        // Calculate prices based on category suggested prices
        const baseRate = category.suggested_price_daily;
        const priceVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
        const dailyRate = Math.max(5, baseRate + priceVariation);
        const weeklyRate = Math.round(dailyRate * 6);
        const monthlyRate = Math.round(dailyRate * 22);

        // Calculate estimated value
        const estimatedValue = Math.round(dailyRate * 50 + Math.random() * 200);

        // Create listing
        const listing = new Listing({
          owner_id: user._id,
          title: title,
          description: description,
          photos: [photoPath],
          category_id: category._id,
          brand: equipment.brand,
          model: equipment.model,
          size: getRandom(equipment.sizes),
          daily_rate: dailyRate,
          weekly_rate: weeklyRate,
          monthly_rate: monthlyRate,
          estimated_value: estimatedValue,
          condition: condition,
          location_id: location._id,
          available: true
        });

        await listing.save();
        listingsCreated++;

        console.log(`  [${i + 1}/10] ${title} - ${categoryName} - $${dailyRate}/day`);
      }
      console.log('');
    }

    // Summary
    console.log('=== Summary ===');
    console.log(`✅ Created ${listingsCreated} listings`);
    console.log(`📷 Used ${photoIndex} photos`);
    console.log(`👥 Listings distributed across ${users.length} users\n`);

    // Count listings per user
    for (const user of users) {
      const count = await Listing.countDocuments({ owner_id: user._id });
      console.log(`   ${user.nickname}: ${count} listings`);
    }

    // Count listings per category
    console.log('\n📊 Listings per category:');
    for (const category of categories) {
      const count = await Listing.countDocuments({ category_id: category._id });
      if (count > 0) {
        console.log(`   ${category.name}: ${count} listings`);
      }
    }

    console.log('\n✅ Test listings population completed successfully!');

  } catch (error) {
    console.error('\n❌ Error populating test listings:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
populateTestListings();
