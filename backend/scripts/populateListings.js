const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Listing = require('../models/Listing');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample data
const categories = [
  { name: 'Skis', suggested_price_daily: 45, suggested_price_weekly: 250, suggested_price_monthly: 800 },
  { name: 'Snowboards', suggested_price_daily: 40, suggested_price_weekly: 220, suggested_price_monthly: 700 },
  { name: 'Boots', suggested_price_daily: 25, suggested_price_weekly: 140, suggested_price_monthly: 450 },
  { name: 'Poles', suggested_price_daily: 10, suggested_price_weekly: 50, suggested_price_monthly: 150 },
  { name: 'Goggles', suggested_price_daily: 15, suggested_price_weekly: 75, suggested_price_monthly: 200 },
  { name: 'Helmets', suggested_price_daily: 12, suggested_price_weekly: 60, suggested_price_monthly: 180 },
  { name: 'Accessories', suggested_price_daily: 8, suggested_price_weekly: 40, suggested_price_monthly: 120 }
];

const locations = [
  { city: 'Wroclaw', country: 'Poland', latitude: 51.1079, longitude: 17.0385 },
  { city: 'Zakopane', country: 'Poland', latitude: 49.2992, longitude: 19.9496 },
  { city: 'Krakow', country: 'Poland', latitude: 50.0647, longitude: 19.9450 },
  { city: 'Warsaw', country: 'Poland', latitude: 52.2297, longitude: 21.0122 },
  { city: 'Aspen', state: 'CO', country: 'USA', latitude: 39.1911, longitude: -106.8175 },
  { city: 'Vail', state: 'CO', country: 'USA', latitude: 39.6403, longitude: -106.3742 },
  { city: 'Breckenridge', state: 'CO', country: 'USA', latitude: 39.4817, longitude: -106.0384 },
  { city: 'Park City', state: 'UT', country: 'USA', latitude: 40.6461, longitude: -111.4980 },
  { city: 'Whistler', state: 'BC', country: 'Canada', latitude: 50.1163, longitude: -122.9574 },
  { city: 'Chamonix', country: 'France', latitude: 45.9237, longitude: 6.8694 }
];

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

// Unsplash image URLs (ski equipment themed)
const imageUrls = {
  skis: [
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1609390621955-48e37fe2d7de?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=600&fit=crop'
  ],
  snowboards: [
    'https://images.unsplash.com/photo-1608447272409-a46ab38c6c90?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1519315901367-dd6f52257273?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1579189214311-f8e0f0f8f9f5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600362834097-1c1c4a212024?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'
  ],
  accessories: [
    'https://images.unsplash.com/photo-1605606274249-2e41f6e8a5b0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1483381719261-1d24c6f0f7b0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585435465455-d1d0c66c5b7e?w=800&h=600&fit=crop'
  ]
};

const populateDatabase = async () => {
  try {
    console.log('Starting database population...\n');

    // Find or create the skiswap@gmail.com user
    let mainUser = await User.findOne({ email: 'skiswap@gmail.com' });
    if (!mainUser) {
      console.log('Creating skiswap@gmail.com user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      mainUser = new User({
        user_type: 'individual',
        nickname: 'skiswap',
        first_name: 'Ski',
        last_name: 'Swap',
        email: 'skiswap@gmail.com',
        password_hash: hashedPassword,
        id_verified: true,
        rating_avg: 4.8
      });
      await mainUser.save();
      console.log('✓ Main user created\n');
    } else {
      console.log('✓ Main user found\n');
    }

    // Create additional users
    console.log('Creating additional users...');
    const additionalUsers = [];
    for (let i = 1; i <= 5; i++) {
      let user = await User.findOne({ email: `user${i}@example.com` });
      if (!user) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        user = new User({
          user_type: 'individual',
          nickname: `user${i}`,
          first_name: `User`,
          last_name: `${i}`,
          email: `user${i}@example.com`,
          password_hash: hashedPassword,
          id_verified: Math.random() > 0.5,
          rating_avg: Math.floor(Math.random() * 2 + 3.5 * 10) / 10
        });
        await user.save();
      }
      additionalUsers.push(user);
    }
    console.log(`✓ Created/found ${additionalUsers.length} additional users\n`);

    // Create or find categories
    console.log('Creating categories...');
    const categoryDocs = {};
    for (const cat of categories) {
      let category = await Category.findOne({ name: cat.name });
      if (!category) {
        category = new Category(cat);
        await category.save();
      }
      categoryDocs[cat.name] = category;
    }
    console.log('✓ Categories created\n');

    // Create locations
    console.log('Creating locations...');
    const locationDocs = [];
    for (const loc of locations) {
      const location = new Location(loc);
      await location.save();
      locationDocs.push(location);
    }
    console.log(`✓ Created ${locationDocs.length} locations\n`);

    // Helper function to get random item from array
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Helper function to get random images
    const getRandomImages = (category, count = 3) => {
      const categoryImages = imageUrls[category] || imageUrls.accessories;
      const images = [];
      for (let i = 0; i < count; i++) {
        images.push(getRandom(categoryImages));
      }
      return images;
    };

    // Create listings
    console.log('Creating listings...\n');
    let listingsCreated = 0;

    // Create ski listings (10 total, 4 owned by mainUser)
    for (let i = 0; i < 10; i++) {
      const skiData = skiListings[i];
      const owner = i < 4 ? mainUser : getRandom(additionalUsers);
      const location = getRandom(locationDocs);

      const baseRate = categoryDocs['Skis'].suggested_price_daily;
      const priceVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10
      const dailyRate = Math.max(10, baseRate + priceVariation); // Ensure minimum rate of 10

      const listing = new Listing({
        owner_id: owner._id,
        title: skiData.title,
        description: skiData.description,
        photos: getRandomImages('skis', Math.floor(Math.random() * 3 + 2)),
        category_id: categoryDocs['Skis']._id,
        brand: skiData.brand,
        model: skiData.model,
        size: skiData.size,
        daily_rate: dailyRate,
        weekly_rate: dailyRate * 6,
        monthly_rate: dailyRate * 22,
        estimated_value: Math.floor(Math.random() * 400 + 400),
        condition: getRandom(conditions),
        location_id: location._id,
        available: true
      });
      await listing.save();
      listingsCreated++;
      console.log(`✓ Created: ${skiData.title} (Owner: ${owner.nickname})`);
    }

    // Create snowboard listings (8 total, 3 owned by mainUser)
    for (let i = 0; i < 8; i++) {
      const boardData = snowboardListings[i];
      const owner = i < 3 ? mainUser : getRandom(additionalUsers);
      const location = getRandom(locationDocs);

      const baseRate = categoryDocs['Snowboards'].suggested_price_daily;
      const priceVariation = Math.floor(Math.random() * 20) - 10;
      const dailyRate = Math.max(10, baseRate + priceVariation);

      const listing = new Listing({
        owner_id: owner._id,
        title: boardData.title,
        description: boardData.description,
        photos: getRandomImages('snowboards', Math.floor(Math.random() * 3 + 2)),
        category_id: categoryDocs['Snowboards']._id,
        brand: boardData.brand,
        model: boardData.model,
        size: boardData.size,
        daily_rate: dailyRate,
        weekly_rate: dailyRate * 6,
        monthly_rate: dailyRate * 22,
        estimated_value: Math.floor(Math.random() * 350 + 350),
        condition: getRandom(conditions),
        location_id: location._id,
        available: true
      });
      await listing.save();
      listingsCreated++;
      console.log(`✓ Created: ${boardData.title} (Owner: ${owner.nickname})`);
    }

    // Create accessory listings (12 total, 3 owned by mainUser)
    for (let i = 0; i < 12; i++) {
      const accData = accessoryListings[i];
      const owner = i < 3 ? mainUser : getRandom(additionalUsers);
      const location = getRandom(locationDocs);

      const categoryName = accData.category || 'Accessories';
      const baseRate = categoryDocs[categoryName].suggested_price_daily;
      const priceVariation = Math.floor(Math.random() * 10) - 5;
      const dailyRate = Math.max(5, baseRate + priceVariation);

      const listing = new Listing({
        owner_id: owner._id,
        title: accData.title,
        description: accData.description,
        photos: getRandomImages('accessories', Math.floor(Math.random() * 3 + 2)),
        category_id: categoryDocs[categoryName]._id,
        brand: accData.brand,
        model: accData.model,
        size: accData.size,
        daily_rate: dailyRate,
        weekly_rate: dailyRate * 6,
        monthly_rate: dailyRate * 22,
        estimated_value: Math.floor(Math.random() * 200 + 100),
        condition: getRandom(conditions),
        location_id: location._id,
        available: true
      });
      await listing.save();
      listingsCreated++;
      console.log(`✓ Created: ${accData.title} (Owner: ${owner.nickname})`);
    }

    // Ensure skiswap@gmail.com has exactly 20 listings
    const mainUserListings = await Listing.countDocuments({ owner_id: mainUser._id });
    if (mainUserListings < 20) {
      console.log(`\n⚠️  skiswap@gmail.com only has ${mainUserListings} listings. Creating ${20 - mainUserListings} more...`);

      const remainingCount = 20 - mainUserListings;
      for (let i = 0; i < remainingCount; i++) {
        const owner = mainUser;
        const location = getRandom(locationDocs);

        // Create additional ski listings
        const skiData = skiListings[i % skiListings.length];
        const baseRate = categoryDocs['Skis'].suggested_price_daily;
        const priceVariation = Math.floor(Math.random() * 20) - 10;
        const dailyRate = Math.max(10, baseRate + priceVariation);

        const listing = new Listing({
          owner_id: owner._id,
          title: `${skiData.title} #${i + 1}`,
          description: skiData.description,
          photos: getRandomImages('skis', Math.floor(Math.random() * 3 + 2)),
          category_id: categoryDocs['Skis']._id,
          brand: skiData.brand,
          model: skiData.model,
          size: skiData.size,
          daily_rate: dailyRate,
          weekly_rate: dailyRate * 6,
          monthly_rate: dailyRate * 22,
          estimated_value: Math.floor(Math.random() * 400 + 400),
          condition: getRandom(conditions),
          location_id: location._id,
          available: true
        });
        await listing.save();
        listingsCreated++;
        console.log(`✓ Created additional: ${listing.title} (Owner: ${owner.nickname})`);
      }
    }

    const finalMainUserListings = await Listing.countDocuments({ owner_id: mainUser._id });
    console.log(`\n✅ Database population completed!`);
    console.log(`Total listings created: ${listingsCreated}`);
    console.log(`Listings owned by skiswap@gmail.com: ${finalMainUserListings}`);

  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
connectDB().then(() => {
  populateDatabase();
});
