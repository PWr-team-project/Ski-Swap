const express = require('express');
const router = express.Router();
const BookingMessage = require('../models/BookingMessage');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/booking_messages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'message-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * @route   GET /api/bookings/:bookingId/chat/messages
 * @desc    Get all messages for a specific booking
 * @access  Private (only booking participants)
 */
router.get('/:bookingId/chat/messages', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // Verify user is part of the booking
    const booking = await Booking.findById(bookingId).populate('listing_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isRenter = booking.renter_id.toString() === userId;
    const isOwner = booking.listing_id?.owner_id?.toString() === userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Access denied. You are not part of this booking.' });
    }

    // Get all messages for this booking
    const messages = await BookingMessage.find({ booking_id: bookingId })
      .populate('sender_id', 'nickname first_name last_name profile_photo')
      .sort({ createdAt: 1 });

    // Mark messages as read for the current user
    const otherUserId = isRenter ? booking.listing_id.owner_id : booking.renter_id;
    await BookingMessage.updateMany(
      {
        booking_id: bookingId,
        sender_id: otherUserId,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    res.json({
      success: true,
      messages: messages,
      booking: {
        _id: booking._id,
        current_status: booking.current_status,
        renter_id: booking.renter_id,
        owner_id: booking.listing_id?.owner_id
      }
    });
  } catch (error) {
    console.error('Error fetching booking messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/bookings/:bookingId/chat/send
 * @desc    Send a message in booking chat
 * @access  Private (only booking participants)
 */
router.post('/:bookingId/chat/send', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message content or attachment required' });
    }

    // Verify user is part of the booking
    const booking = await Booking.findById(bookingId).populate('listing_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isRenter = booking.renter_id.toString() === userId;
    const isOwner = booking.listing_id?.owner_id?.toString() === userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Access denied. You are not part of this booking.' });
    }

    // Check if chat is allowed (ACCEPTED or later, but not COMPLETED or terminal states)
    const allowedStatuses = ['ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS',
                             'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];

    if (!allowedStatuses.includes(booking.current_status)) {
      return res.status(403).json({
        message: 'Chat is not available for this booking status',
        current_status: booking.current_status
      });
    }

    // Create the message
    const newMessage = new BookingMessage({
      booking_id: bookingId,
      sender_id: userId,
      message_type: 'user_message',
      content: content || '',
      attachment: req.file ? `/uploads/booking_messages/${req.file.filename}` : null
    });

    await newMessage.save();

    // Populate sender info for response
    await newMessage.populate('sender_id', 'nickname first_name last_name profile_photo');

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`booking-${bookingId}`).emit('booking-message', {
        message: newMessage,
        bookingId: bookingId
      });
    }

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending booking message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/bookings/:bookingId/chat/status
 * @desc    Get chat status (enabled/disabled, read-only)
 * @access  Private (only booking participants)
 */
router.get('/:bookingId/chat/status', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // Verify user is part of the booking
    const booking = await Booking.findById(bookingId).populate('listing_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isRenter = booking.renter_id.toString() === userId;
    const isOwner = booking.listing_id?.owner_id?.toString() === userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Determine chat status
    const chatNotAvailable = ['PENDING', 'DECLINED', 'CANCELLED'];
    const chatReadOnly = ['COMPLETED', 'REVIEWED', 'DISPUTED', 'DISPUTE_RESOLVED'];
    const chatActive = ['ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS',
                        'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];

    let chatStatus = {
      enabled: false,
      readOnly: false,
      visible: false,
      message: ''
    };

    if (chatNotAvailable.includes(booking.current_status)) {
      chatStatus = {
        enabled: false,
        readOnly: false,
        visible: false,
        message: 'Chat is not available yet'
      };
    } else if (chatReadOnly.includes(booking.current_status)) {
      chatStatus = {
        enabled: true,
        readOnly: true,
        visible: true,
        message: 'Chat history (read-only)'
      };
    } else if (chatActive.includes(booking.current_status)) {
      chatStatus = {
        enabled: true,
        readOnly: false,
        visible: true,
        message: 'Chat with ' + (isRenter ? 'owner' : 'renter')
      };
    }

    res.json({
      success: true,
      chatStatus: chatStatus,
      bookingStatus: booking.current_status
    });
  } catch (error) {
    console.error('Error getting chat status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
