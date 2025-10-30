const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const Location = require('../models/Location');
const jwt = require('jsonwebtoken');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/listings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'listing-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    // Allowed image extensions
    const allowedExtensions = /jpeg|jpg|jfif|jpe|png|gif|webp|bmp|heic|heif|svg/i;

    // Allowed MIME types
    const allowedMimeTypes = /image\/(jpeg|jpg|jfif|png|gif|webp|bmp|heic|heif|svg\+xml)/i;

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    // Allow if either extension or mimetype matches (some systems don't set proper MIME types)
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed! File type: ${file.mimetype}, Extension: ${path.extname(file.originalname)}`));
    }
  }
});

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new listing
router.post('/create', authMiddleware, upload.array('photos', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      brand,
      model,
      size,
      dailyRate,
      weeklyRate,
      monthlyRate,
      estimatedValue,
      condition,
      city,
      state,
      country,
      street,
      streetNumber,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !dailyRate || !condition) {
      return res.status(400).json({
        message: 'Missing required fields: title, description, category, dailyRate, and condition are required'
      });
    }

    if (!city || !country || !latitude || !longitude) {
      return res.status(400).json({
        message: 'Missing required location fields: city, country, latitude, and longitude are required'
      });
    }

    // Find or create category
    let categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      categoryDoc = new Category({ name: category });
      await categoryDoc.save();
    }

    // Create location
    const location = new Location({
      city,
      state: state || '',
      country,
      street: street || '',
      street_number: streetNumber || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });
    await location.save();

    // Get uploaded photo paths
    const photos = req.files ? req.files.map(file => `/uploads/listings/${file.filename}`) : [];

    // Create listing
    const listing = new Listing({
      owner_id: req.userId,
      title,
      description,
      photos,
      category_id: categoryDoc._id,
      brand: brand || '',
      model: model || '',
      size: size || '',
      daily_rate: parseFloat(dailyRate),
      weekly_rate: weeklyRate ? parseFloat(weeklyRate) : undefined,
      monthly_rate: monthlyRate ? parseFloat(monthlyRate) : undefined,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
      condition,
      location_id: location._id,
      available: true
    });

    await listing.save();

    // Populate the listing before sending response
    await listing.populate('category_id', 'name');
    await listing.populate('location_id');

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's own listings (must come BEFORE /:id route)
router.get('/my/listings', authMiddleware, async (req, res) => {
  try {
    const listings = await Listing.find({ owner_id: req.userId })
      .populate('category_id', 'name')
      .populate('location_id')
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find({ available: true })
      .populate('owner_id', 'nickname first_name last_name profile_photo')
      .populate('category_id', 'name')
      .populate('location_id')
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single listing by ID (must come AFTER specific routes like /my/listings)
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('owner_id', 'nickname first_name last_name profile_photo email')
      .populate('category_id', 'name')
      .populate('location_id');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a listing
router.put('/:id', authMiddleware, upload.array('photos', 10), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is the owner
    if (listing.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const {
      title,
      description,
      category,
      brand,
      model,
      size,
      dailyRate,
      weeklyRate,
      monthlyRate,
      estimatedValue,
      condition,
      available
    } = req.body;

    // Update fields
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (brand) listing.brand = brand;
    if (model) listing.model = model;
    if (size) listing.size = size;
    if (dailyRate) listing.daily_rate = parseFloat(dailyRate);
    if (weeklyRate !== undefined) listing.weekly_rate = weeklyRate ? parseFloat(weeklyRate) : undefined;
    if (monthlyRate !== undefined) listing.monthly_rate = monthlyRate ? parseFloat(monthlyRate) : undefined;
    if (estimatedValue !== undefined) listing.estimated_value = estimatedValue ? parseFloat(estimatedValue) : undefined;
    if (condition) listing.condition = condition;
    if (available !== undefined) listing.available = available === 'true' || available === true;

    // Update category if provided
    if (category) {
      let categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        categoryDoc = new Category({ name: category });
        await categoryDoc.save();
      }
      listing.category_id = categoryDoc._id;
    }

    // Add new photos if provided
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => `/uploads/listings/${file.filename}`);
      listing.photos = [...listing.photos, ...newPhotos];
    }

    await listing.save();
    await listing.populate('category_id', 'name');
    await listing.populate('location_id');

    res.json({
      message: 'Listing updated successfully',
      listing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is the owner
    if (listing.owner_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    // Delete associated photos
    listing.photos.forEach(photoPath => {
      const fullPath = path.join(__dirname, '..', photoPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
