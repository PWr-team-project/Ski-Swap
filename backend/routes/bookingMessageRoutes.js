const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BookingMessage = require('../models/BookingMessage');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

console.log('[BookingMessageRoutes] Module loaded');

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
console.log('[BookingMessageRoutes] Registering GET /:bookingId/messages route');
router.get('/:bookingId/messages', auth, async (req, res) => {
  console.log('[BookingMessages] ===== ROUTE HIT =====');
  try {
    const { bookingId } = req.params;

    console.log('[BookingMessages] GET messages request', {
      bookingId,
      userId: req.userId,
      userEmail: req.userEmail
    });

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log('[BookingMessages] Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is renter or owner
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.owner_id.toString() === req.userId;

    console.log('[BookingMessages] Access check', {
      isRenter,
      isOwner,
      renterId: booking.renter_id.toString(),
      ownerId: booking.owner_id.toString(),
      userId: req.userId
    });

    if (!isRenter && !isOwner) {
      console.log('[BookingMessages] Access denied - user is neither renter nor owner');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is accepted (chat only opens after acceptance)
    const CHAT_ENABLED_STATUSES = [
      'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER',
      'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER',
      'COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'
    ];

    console.log('[BookingMessages] Checking chat access', {
      bookingId,
      currentStatus: booking.current_status,
      currentStatusType: typeof booking.current_status,
      enabledStatuses: CHAT_ENABLED_STATUSES,
      isStatusEnabled: CHAT_ENABLED_STATUSES.includes(booking.current_status),
      exactComparison: {
        'CANCELLED': booking.current_status === 'CANCELLED',
        'DECLINED': booking.current_status === 'DECLINED'
      }
    });

    if (!CHAT_ENABLED_STATUSES.includes(booking.current_status)) {
      console.log('[BookingMessages] Chat not enabled - status is:', booking.current_status);
      console.log('[BookingMessages] Status character codes:', Array.from(booking.current_status).map(c => c.charCodeAt(0)));
      return res.status(403).json({
        message: 'Chat is only available after booking is accepted',
        chatEnabled: false
      });
    }

    // Get all messages for this booking
    const messages = await BookingMessage.find({ booking_id: bookingId })
      .populate('sender_id', 'nickname first_name last_name profile_photo')
      .sort({ sent_at: 1 });

    console.log('[BookingMessages] Messages retrieved from database', {
      messageCount: messages.length,
      bookingId
    });

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

    // Chat is never frozen as per new requirements
    const isChatFrozen = false;

    console.log('[BookingMessages] Sending response', {
      messageCount: formattedMessages.length,
      chatEnabled: true,
      isChatFrozen
    });

    res.json({
      messages: formattedMessages,
      chatEnabled: true,
      isChatFrozen
    });
  } catch (error) {
    console.error('[BookingMessages] Error fetching booking messages:', error);
    console.error('[BookingMessages] Error stack:', error.stack);
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

    console.log('[BookingMessages] POST message request', {
      bookingId,
      userId: req.userId,
      hasContent: !!content,
      hasImage: !!req.file
    });

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log('[BookingMessages] Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is renter or owner
    const isRenter = booking.renter_id.toString() === req.userId;
    const isOwner = booking.owner_id.toString() === req.userId;

    console.log('[BookingMessages] Send message access check', {
      isRenter,
      isOwner,
      currentStatus: booking.current_status
    });

    if (!isRenter && !isOwner) {
      console.log('[BookingMessages] Send access denied - user is neither renter nor owner');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if chat is available
    const CHAT_ENABLED_STATUSES = [
      'ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER',
      'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER',
      'COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'
    ];

    if (!CHAT_ENABLED_STATUSES.includes(booking.current_status)) {
      console.log('[BookingMessages] Cannot send message - status not enabled:', booking.current_status);
      return res.status(403).json({
        message: 'Cannot send messages in this booking status'
      });
    }

    // Validate message has content or image
    if (!content && !req.file) {
      console.log('[BookingMessages] Validation failed - no content or image');
      return res.status(400).json({ message: 'Message must have content or image' });
    }

    // Determine message type
    const messageType = req.file && !content ? 'image' : 'text';

    console.log('[BookingMessages] Creating new message', {
      messageType,
      hasAttachment: !!req.file
    });

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
    console.log('[BookingMessages] Message saved to database:', newMessage._id);

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
        console.log('[BookingMessages] Emitting socket event to room:', `booking-${bookingId}`);
        io.to(`booking-${bookingId}`).emit('booking-message:received', formattedMessage);
      } else {
        console.log('[BookingMessages] Socket.io not initialized');
      }
    } catch (err) {
      console.log('[BookingMessages] Socket.io error:', err.message);
    }

    console.log('[BookingMessages] Message sent successfully:', formattedMessage._id);
    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error('[BookingMessages] Error sending booking message:', error);
    console.error('[BookingMessages] Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
