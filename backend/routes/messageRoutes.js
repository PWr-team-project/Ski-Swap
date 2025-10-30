const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {auth, isAdmin} = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/messages');
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
    cb(null, 'message-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all conversations for the logged-in user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
      .populate('participants', 'nickname first_name last_name profile_photo')
      .populate({
        path: 'lastMessage',
        select: 'message_text attachment sent_at'
      })
      .sort({ lastMessageTime: -1 });

    // Format conversations for frontend
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUser = conv.participants.find(p => p._id.toString() !== req.userId);

      // Count unread messages
      const unreadCount = await Message.countDocuments({
        sender_id: otherUser._id,
        receiver_id: req.userId,
        is_read: false
      });

      return {
        _id: conv._id,
        otherUser: {
          _id: otherUser._id,
          nickname: otherUser.nickname,
          first_name: otherUser.first_name,
          last_name: otherUser.last_name,
          profile_photo: otherUser.profile_photo
        },
        lastMessage: {
          content: conv.lastMessage?.message_text || '',
          image: conv.lastMessage?.attachment || null
        },
        lastMessageTime: conv.lastMessageTime,
        unreadCount
      };
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.isParticipant(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get other participant
    const otherUserId = conversation.participants.find(p => p.toString() !== req.userId);

    // Find all messages between these two users
    const messages = await Message.find({
      $or: [
        { sender_id: req.userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: req.userId }
      ],
      deleted_by_sender: false,
      deleted_by_receiver: false
    })
      .populate('sender_id', 'nickname first_name last_name profile_photo')
      .populate('receiver_id', 'nickname first_name last_name profile_photo')
      .sort({ sent_at: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender_id: otherUserId,
        receiver_id: req.userId,
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: {
        _id: msg.sender_id._id,
        nickname: msg.sender_id.nickname
      },
      content: msg.message_text,
      image: msg.attachment ? `/uploads/messages/${path.basename(msg.attachment)}` : null,
      createdAt: msg.sent_at,
      read: msg.is_read
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get io instance from main app
let io;
try {
  io = require('../index').io;
} catch (err) {
  console.log('Socket.io not available yet');
}

// Send a message
router.post('/send', auth, upload.single('image'), async (req, res) => {
  try {
    const { conversationId, content, receiverId } = req.body;
    let conversation;

    // If conversationId is provided, use it
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (!conversation.isParticipant(req.userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (receiverId) {
      // Create or find conversation
      conversation = await Conversation.findOne({
        participants: { $all: [req.userId, receiverId] }
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [req.userId, receiverId]
        });
        await conversation.save();
      }
    } else {
      return res.status(400).json({ message: 'conversationId or receiverId required' });
    }

    // Get receiver ID
    const receiverUserId = conversation.participants.find(p => p.toString() !== req.userId);

    // Validate message has content or image
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message must have content or image' });
    }

    // Create message
    const newMessage = new Message({
      sender_id: req.userId,
      receiver_id: receiverUserId,
      message_text: content || '',
      attachment: req.file ? req.file.path : null,
      sent_at: new Date()
    });

    await newMessage.save();

    // Update conversation
    conversation.lastMessage = newMessage._id;
    conversation.lastMessageTime = newMessage.sent_at;
    await conversation.save();

    // Populate sender info
    await newMessage.populate('sender_id', 'nickname first_name last_name profile_photo');

    // Format response
    const formattedMessage = {
      _id: newMessage._id,
      sender: {
        _id: newMessage.sender_id._id,
        nickname: newMessage.sender_id.nickname
      },
      content: newMessage.message_text,
      image: newMessage.attachment ? `/uploads/messages/${path.basename(newMessage.attachment)}` : null,
      createdAt: newMessage.sent_at,
      read: newMessage.is_read
    };

    // Emit real-time event to conversation room
    if (io) {
      io.to(conversation._id.toString()).emit('message:received', formattedMessage);
    }

    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start a new conversation
router.post('/start-conversation', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.userId, receiverId]
      });
      await conversation.save();
    }

    await conversation.populate('participants', 'nickname first_name last_name profile_photo');

    const otherUser = conversation.participants.find(p => p._id.toString() !== req.userId);

    res.status(201).json({
      conversation: {
        _id: conversation._id,
        otherUser: {
          _id: otherUser._id,
          nickname: otherUser.nickname,
          first_name: otherUser.first_name,
          last_name: otherUser.last_name,
          profile_photo: otherUser.profile_photo
        },
        lastMessage: { content: '', image: null },
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: 0
      }
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
