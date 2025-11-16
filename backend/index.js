require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIO = require('socket.io');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const listingRoutes = require('./routes/listingRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files for uploaded images
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes); // Google OAuth routes
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running!' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Store online users: { userId: socketId }
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins with their ID
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);

    // Broadcast to all clients that this user is online
    io.emit('user:status', { userId, status: 'online' });
  });

  // User joins a conversation room
  socket.on('conversation:join', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // User leaves a conversation room
  socket.on('conversation:leave', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Send message (called from API, not directly from client)
  socket.on('message:send', (data) => {
    const { conversationId, message } = data;
    // Broadcast to all users in the conversation
    io.to(conversationId).emit('message:received', message);
  });

  // User is typing indicator
  socket.on('typing:start', (data) => {
    const { conversationId, userId, userName } = data;
    socket.to(conversationId).emit('typing:start', { userId, userName });
  });

  socket.on('typing:stop', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('typing:stop', { userId });
  });

  // Mark messages as read
  socket.on('messages:read', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('messages:read', { userId });
  });

  socket.on('disconnect', () => {
    // Find and remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} is offline`);
        // Broadcast to all clients that this user is offline
        io.emit('user:status', { userId, status: 'offline' });
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Export io instance to use in routes
module.exports.io = io;