const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BookingMessage = require('../models/BookingMessage');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/booking-messages');
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
    cb(null, 'booking-msg-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @route GET /api/bookings/:bookingId/messages
 * @desc Get all messages for a booking
 * @access Private (renter or owner only)
 */
router.get('/:bookingId/messages', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is renter or owner
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is accepted (chat only opens after acceptance)
    const CHAT_ENABLED_STATUSES = [
      'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER',
      'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER',
      'COMPLETED', 'REVIEWED'
    ];

    if (!CHAT_ENABLED_STATUSES.includes(booking.current_status)) {
      return res.status(403).json({
        message: 'Chat is only available after booking is accepted',
        chatEnabled: false
      });
    }

    // Get all messages for this booking
    const messages = await BookingMessage.find({ booking_id: bookingId })
      .populate('sender_id', 'nickname first_name last_name profile_photo')
      .sort({ sent_at: 1 });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender_id ? {
        _id: msg.sender_id._id,
        nickname: msg.sender_id.nickname,
        profilePhoto: msg.sender_id.profile_photo
      } : null, // null for system messages
      messageType: msg.message_type,
      content: msg.message_text,
      image: msg.attachment ? `/uploads/booking-messages/${path.basename(msg.attachment)}` : null,
      statusChange: msg.status_change || null,
      createdAt: msg.sent_at
    }));

    // Check if chat is frozen (COMPLETED or REVIEWED)
    const isChatFrozen = ['COMPLETED', 'REVIEWED'].includes(booking.current_status);

    res.json({
      messages: formattedMessages,
      chatEnabled: true,
      isChatFrozen
    });
  } catch (error) {
    console.error('Error fetching booking messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/bookings/:bookingId/messages
 * @desc Send a message in booking chat
 * @access Private (renter or owner only, not allowed when completed)
 */
router.post('/:bookingId/messages', auth, upload.single('image'), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { content } = req.body;

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is renter or owner
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.owner_id.toString() === req.userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if chat is available
    const CHAT_ENABLED_STATUSES = [
      'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER',
      'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'
    ];

    if (!CHAT_ENABLED_STATUSES.includes(booking.current_status)) {
      return res.status(403).json({
        message: 'Cannot send messages in this booking status'
      });
    }

    // Validate message has content or image
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message must have content or image' });
    }

    // Determine message type
    const messageType = req.file && !content ? 'image' : 'text';

    // Create message
    const newMessage = new BookingMessage({
      booking_id: bookingId,
      sender_id: req.userId,
      message_type: messageType,
      message_text: content || '',
      attachment: req.file ? req.file.path : null,
      sent_at: new Date()
    });

    await newMessage.save();

    // Populate sender info
    await newMessage.populate('sender_id', 'nickname first_name last_name profile_photo');

    // Format response
    const formattedMessage = {
      _id: newMessage._id,
      sender: {
        _id: newMessage.sender_id._id,
        nickname: newMessage.sender_id.nickname,
        profilePhoto: newMessage.sender_id.profile_photo
      },
      messageType: newMessage.message_type,
      content: newMessage.message_text,
      image: newMessage.attachment ? `/uploads/booking-messages/${path.basename(newMessage.attachment)}` : null,
      createdAt: newMessage.sent_at
    };

    // Emit real-time event via Socket.IO
    try {
      const io = require('../index').io;
      if (io) {
        io.to(`booking-${bookingId}`).emit('booking-message:received', formattedMessage);
      }
    } catch (err) {
      console.log('Socket.io not available for booking messages');
    }

    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error('Error sending booking message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
