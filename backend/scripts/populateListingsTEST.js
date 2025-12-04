require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Listing = require('../models/Listing');

const conditions = ['new', 'like new', 'good', 'fair', 'used'];

// Ski listings data
const skiListings = [
  { title: 'K2 Mindbender 99Ti', brand: 'K2', model: 'Mindbender 99Ti', size: '180cm', description: 'All-mountain skis perfect for advanced skiers. Great for both powder and groomed runs.' },
  { title: 'Rossignol Experience 88 Ti', brand: 'Rossignol', model: 'Experience 88 Ti', size: '177cm', description: 'Versatile all-mountain skis with excellent edge grip and stability.' },
  { title: 'Atomic Maverick 95', brand: 'Atomic', model: 'Maverick 95', size: '185cm', description: 'Freeride skis designed for powder performance and all-mountain versatility.' },
  { title: 'Salomon QST 92', brand: 'Salomon', model: 'QST 92', size: '175cm', description: 'Lightweight touring skis perfect for backcountry adventures.' },
  { title: 'Blizzard Rustler 10', brand: 'Blizzard', model: 'Rustler 10', size: '188cm', description: 'Playful freeride skis that excel in deep snow and challenging terrain.' },
  { title: 'Fischer Ranger 102 FR', brand: 'Fischer', model: 'Ranger 102 FR', size: '182cm', description: 'All-mountain freeride skis with powerful performance.' },
  { title: 'Head Kore 93', brand: 'Head', model: 'Kore 93', size: '179cm', description: 'Ultra-lightweight touring skis for uphill efficiency and downhill performance.' },
  { title: 'Volkl Mantra M6', brand: 'Volkl', model: 'Mantra M6', size: '184cm', description: 'Premium all-mountain skis with exceptional edge hold.' },
  { title: 'Nordica Enforcer 100', brand: 'Nordica', model: 'Enforcer 100', size: '186cm', description: 'Powerful all-mountain skis for aggressive skiing.' },
  { title: 'Line Sick Day 104', brand: 'Line', model: 'Sick Day 104', size: '183cm', description: 'Playful powder skis with excellent float.' }
];

// Snowboard listings data
const snowboardListings = [
  { title: 'Burton Custom X', brand: 'Burton', model: 'Custom X', size: '158cm', description: 'High-performance all-mountain snowboard for experienced riders.' },
  { title: 'Lib Tech T.Rice Pro', brand: 'Lib Tech', model: 'T.Rice Pro', size: '161cm', description: 'Travis Rice signature board, perfect for big mountain riding.' },
  { title: 'Jones Mountain Twin', brand: 'Jones', model: 'Mountain Twin', size: '157cm', description: 'Versatile twin board for all-mountain freestyle riding.' },
  { title: 'Capita DOA', brand: 'Capita', model: 'DOA', size: '156cm', description: 'Playful all-mountain board with park-friendly flex.' },
  { title: 'Ride Warpig', brand: 'Ride', model: 'Warpig', size: '148cm', description: 'Short and wide powder slayer with amazing float.' },
  { title: 'GNU Riders Choice', brand: 'GNU', model: 'Riders Choice', size: '159cm', description: 'Jamie Lynn signature board for all-mountain freestyle.' },
  { title: 'Arbor Formula', brand: 'Arbor', model: 'Formula', size: '155cm', description: 'Eco-friendly all-mountain board with great flex.' },
  { title: 'YES Standard', brand: 'YES', model: 'Standard', size: '154cm', description: 'Classic all-mountain board with mid-flex.' }
];

// Accessories listings data
const accessoryListings = [
  { title: 'Smith I/O Mag Goggles', brand: 'Smith', model: 'I/O Mag', size: 'Medium', description: 'Premium goggles with ChromaPop lens technology and magnetic lens change system.', category: 'Goggles' },
  { title: 'POC Obex SPIN Helmet', brand: 'POC', model: 'Obex SPIN', size: 'M/L', description: 'Advanced protection helmet with SPIN technology for added safety.', category: 'Helmets' },
  { title: 'Black Diamond Carbon Cork', brand: 'Black Diamond', model: 'Carbon Cork', size: '125cm', description: 'Lightweight carbon fiber ski poles with cork grips.', category: 'Poles' },
  { title: 'Burton AK 25L Backpack', brand: 'Burton', model: 'AK 25L', size: '25L', description: 'Technical ski backpack with organized storage and hydration compatibility.', category: 'Accessories' },
  { title: 'Dakine Boot Locker 69L', brand: 'Dakine', model: 'Boot Locker', size: '69L', description: 'Spacious boot bag with ventilated compartments.', category: 'Accessories' },
  { title: 'Oakley Flight Deck XM', brand: 'Oakley', model: 'Flight Deck XM', size: 'Medium', description: 'Wide-view goggles with Prizm lens technology.', category: 'Goggles' },
  { title: 'Giro Range MIPS', brand: 'Giro', model: 'Range MIPS', size: 'L', description: 'Lightweight helmet with MIPS protection system.', category: 'Helmets' },
  { title: 'Rossignol Experience Pro', brand: 'Rossignol', model: 'Experience Pro', size: '120cm', description: 'Durable aluminum poles for all-mountain skiing.', category: 'Poles' },
  { title: 'Atomic Hawx Ultra 130', brand: 'Atomic', model: 'Hawx Ultra 130', size: '27.5', description: 'High-performance ski boots with precision fit.', category: 'Boots' },
  { title: 'Salomon S/PRO 120', brand: 'Salomon', model: 'S/PRO 120', size: '26.5', description: 'Customizable ski boots for advanced skiers.', category: 'Boots' },
  { title: 'Burton Ion BOA', brand: 'Burton', model: 'Ion BOA', size: '10', description: 'Premium snowboard boots with BOA lacing system.', category: 'Boots' },
  { title: 'ThirtyTwo TM-2', brand: 'ThirtyTwo', model: 'TM-2', size: '11', description: 'Responsive snowboard boots with heat-moldable liners.', category: 'Boots' }
];

// Get all available photos from backend/uploads/listings directory
const uploadsDir = path.join(__dirname, '..', 'uploads', 'listings');
let availablePhotos = [];

try {
  availablePhotos = fs.readdirSync(uploadsDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.jfif'].includes(ext);
  });
  console.log(`Found ${availablePhotos.length} photos in ${uploadsDir}`);
} catch (error) {
  console.error('Error reading photos directory:', error.message);
  availablePhotos = [];
}

// Helper functions
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomImages = (category, count = 3) => {
  if (availablePhotos.length === 0) {
    console.warn('No photos available, listing will have no photos');
    return [];
  }

  const images = [];
  const usedIndices = new Set();

  // Get random unique photos
  for (let i = 0; i < Math.min(count, availablePhotos.length); i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * availablePhotos.length);
    } while (usedIndices.has(randomIndex) && usedIndices.size < availablePhotos.length);

    usedIndices.add(randomIndex);
    // Store as relative path: listings/filename
    images.push(`listings/${availablePhotos[randomIndex]}`);
  }

  return images;
};

async function createListingsForUser(user, userName, categories, locations) {
  console.log(`\n=== Creating 20 listings for ${userName} ===`);
  let created = 0;

  // Build listing pool from available categories in database
  const allListings = [];
  const categoryNames = Object.keys(categories);

  categoryNames.forEach(catName => {
    let templates = [];
    let imageType = 'accessories';

    // Match category names to appropriate listing templates
    if (catName.toLowerCase().includes('ski') && !catName.toLowerCase().includes('shoe')) {
      // Skis category
      templates = skiListings.map(l => ({ ...l }));
      imageType = 'skis';
    } else if (catName.toLowerCase().includes('snowboard') && !catName.toLowerCase().includes('shoe')) {
      // Snowboards category
      templates = snowboardListings.map(l => ({ ...l }));
      imageType = 'snowboards';
    } else if (catName.toLowerCase().includes('shoe') || catName.toLowerCase().includes('boot')) {
      // Skiing shoes, Snowboarding shoes
      templates = accessoryListings.filter(l => l.category === 'Boots').map(l => ({ ...l }));
      imageType = 'accessories';
    } else if (catName.toLowerCase().includes('clothing')) {
      // Clothing category
      templates = [
        { title: 'North Face Ski Jacket', brand: 'The North Face', model: 'Freedom', size: 'L', description: 'Waterproof insulated ski jacket with hood.' },
        { title: 'Patagonia Powder Bowl Pants', brand: 'Patagonia', model: 'Powder Bowl', size: 'M', description: 'Gore-Tex ski pants with reinforced edges.' },
        { title: 'Arc\'teryx Base Layer Set', brand: 'Arc\'teryx', model: 'Rho LT', size: 'M', description: 'Moisture-wicking base layer top and bottom.' },
      ];
      imageType = 'accessories';
    } else if (catName.toLowerCase().includes('accessory') || catName.toLowerCase().includes('accessories')) {
      // Accessories category
      templates = accessoryListings.filter(l => l.category === 'Accessories' || l.category === 'Goggles' || l.category === 'Helmets' || l.category === 'Poles').map(l => ({ ...l }));
      imageType = 'accessories';
    } else if (catName.toLowerCase().includes('kid')) {
      // For kids category
      templates = [
        { title: 'Kids Ski Set', brand: 'Rossignol', model: 'Experience Pro', size: '130cm', description: 'Complete ski set for children aged 8-12.' },
        { title: 'Kids Snowboard', brand: 'Burton', model: 'Chopper', size: '120cm', description: 'Beginner-friendly kids snowboard.' },
        { title: 'Kids Ski Boots', brand: 'Salomon', model: 'T3 RT', size: '24.5', description: 'Comfortable and warm ski boots for kids.' },
      ];
      imageType = 'accessories';
    } else {
      // Fallback: use ski templates
      templates = skiListings.map(l => ({ ...l }));
      imageType = 'skis';
    }

    // Add templates to the pool
    if (templates.length > 0) {
      allListings.push(...templates.map(l => ({ ...l, categoryName: catName, imageType })));
    }
  });

  // Create 20 listings, cycling through available templates
  for (let i = 0; i < 20; i++) {
    const listingData = allListings[i % allListings.length];
    const location = getRandom(locations);
    const category = categories[listingData.categoryName];

    const baseRate = category.suggested_price_daily || 30;
    const priceVariation = Math.floor(Math.random() * 20) - 10;
    const dailyRate = Math.max(5, baseRate + priceVariation);

    const listing = new Listing({
      owner_id: user._id,
      title: `${listingData.title} ${i >= allListings.length ? '#' + Math.floor(i / allListings.length + 1) : ''}`.trim(),
      description: listingData.description,
      photos: getRandomImages(listingData.imageType, Math.floor(Math.random() * 3 + 2)),
      category_id: category._id,
      brand: listingData.brand,
      model: listingData.model,
      size: listingData.size,
      daily_rate: dailyRate,
      weekly_rate: dailyRate * 6,
      monthly_rate: dailyRate * 22,
      estimated_value: Math.floor(Math.random() * 400 + 200),
      condition: getRandom(conditions),
      location_id: location._id,
      available: true
    });

    await listing.save();
    created++;
    console.log(`  [${i + 1}/20] Created: ${listing.title} (Category: ${listingData.categoryName})`);
  }

  return created;
}

async function populateListingsTEST() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if photos are available
    if (availablePhotos.length === 0) {
      console.error('WARNING: No photos found in backend/uploads/listings directory!');
      console.error('Listings will be created without photos.');
    } else {
      console.log(`✓ Loaded ${availablePhotos.length} photos from backend/uploads/listings`);
    }

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

    // Get all categories from database
    const allCategories = await Category.find();
    if (allCategories.length === 0) {
      console.error('No categories found! Please run populateListings.js first to create categories.');
      process.exit(1);
    }

    const categoryDocs = {};
    allCategories.forEach(cat => {
      categoryDocs[cat.name] = cat;
    });

    console.log(`✓ Found ${allCategories.length} categories:`);
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (daily rate: $${cat.suggested_price_daily})`);
    });

    // Get locations
    const locations = await Location.find();
    if (locations.length === 0) {
      console.error('No locations found! Please run populateListings.js first to create locations.');
      process.exit(1);
    }
    console.log(`✓ Found ${locations.length} locations`);

    // Delete existing listings for these two users only
    console.log('\nDeleting existing listings for Ski Swapper and panpatlyk...');
    const deleteResult = await Listing.deleteMany({
      owner_id: { $in: [skiSwapper._id, panpatlyk._id] }
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing listings`);

    // Create listings for both users
    let totalCreated = 0;
    totalCreated += await createListingsForUser(skiSwapper, 'Ski Swapper', categoryDocs, locations);
    totalCreated += await createListingsForUser(panpatlyk, 'panpatlyk', categoryDocs, locations);

    // Summary
    const skiSwapperCount = await Listing.countDocuments({ owner_id: skiSwapper._id });
    const panpatlykCount = await Listing.countDocuments({ owner_id: panpatlyk._id });

    console.log('\n=== Summary ===');
    console.log(`Total listings created: ${totalCreated}`);
    console.log(`Listings owned by ${skiSwapper.first_name} ${skiSwapper.last_name}: ${skiSwapperCount}`);
    console.log(`Listings owned by ${panpatlyk.first_name} ${panpatlyk.last_name}: ${panpatlykCount}`);
    console.log('\n✅ TEST listings population completed successfully!');

  } catch (error) {
    console.error('Error populating test listings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
populateListingsTEST();
