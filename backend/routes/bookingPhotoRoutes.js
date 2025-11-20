const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking');
const BookingPhoto = require('../models/BookingPhoto');
const { auth } = require('../middleware/auth');
const { getCurrentStatus } = require('../utils/bookingStateManager');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/booking-photos');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `booking-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|heic|heif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, heic, heif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/bookings/:id/photos/upload
 * Upload photos for a booking
 * Body: type ('pickup', 'return', or 'dispute')
 * File: photo (multipart/form-data)
 */
router.post('/:id/photos/upload', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['pickup', 'return', 'dispute'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid photo type. Must be: pickup, return, or dispute'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.listing_id.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      // Delete uploaded files
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(403).json({ message: 'Not authorized to upload photos for this booking' });
    }

    // Validate state allows photo upload
    const currentStatus = await getCurrentStatus(req.params.id);

    if (type === 'pickup' && currentStatus !== 'PICKUP') {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({
        message: 'Pickup photos can only be uploaded during PICKUP state'
      });
    }

    if (type === 'return' && currentStatus !== 'RETURN') {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({
        message: 'Return photos can only be uploaded during RETURN state'
      });
    }

    if (type === 'dispute' && currentStatus !== 'DISPUTED') {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({
        message: 'Dispute photos can only be uploaded during DISPUTED state'
      });
    }

    // Validate user type can upload this type
    if (type === 'pickup' && !isRenter) {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(403).json({
        message: 'Only the renter can upload pickup photos'
      });
    }

    if (type === 'return' && !isRenter) {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(403).json({
        message: 'Only the renter can upload return photos'
      });
    }

    // Save photo records to database
    const photoRecords = [];
    for (const file of req.files) {
      const photoRecord = new BookingPhoto({
        booking_id: req.params.id,
        uploaded_by: req.userId,
        type: type,
        url: `/uploads/booking-photos/${file.filename}`
      });
      await photoRecord.save();
      photoRecords.push(photoRecord);
    }

    res.status(201).json({
      message: `${photoRecords.length} photo(s) uploaded successfully`,
      photos: photoRecords
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    console.error('Error uploading photos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/bookings/:id/photos
 * Get all photos for a booking
 * Query params: type (optional) - filter by photo type
 */
router.get('/:id/photos', auth, async (req, res) => {
  try {
    const { type } = req.query;

    const booking = await Booking.findById(req.params.id)
      .populate('listing_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.listing_id.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view photos for this booking' });
    }

    const query = { booking_id: req.params.id };
    if (type && ['pickup', 'return', 'dispute'].includes(type)) {
      query.type = type;
    }

    const photos = await BookingPhoto.find(query)
      .populate('uploaded_by', 'nickname first_name last_name')
      .sort({ createdAt: -1 });

    res.json({
      bookingId: req.params.id,
      photos
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/bookings/:id/photos/:photoId
 * Delete a specific photo
 */
router.delete('/:id/photos/:photoId', auth, async (req, res) => {
  try {
    const photo = await BookingPhoto.findById(req.params.photoId);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    if (photo.booking_id.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Photo does not belong to this booking' });
    }

    // Verify user is the uploader
    if (photo.uploaded_by.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the uploader can delete this photo' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await BookingPhoto.findByIdAndDelete(req.params.photoId);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
