const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

// REST route modules
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const blogRoutes = require('./routes/blogRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const storyRoutes = require('./routes/storyRoutes');
const headchefRoutes = require('./routes/headchefRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const dieticianRoutes = require('./routes/dieticianRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Models used by Socket.IO
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

dotenv.config();
connectDB();

const app = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://forgotten-recipes.vercel.app'
];

// CORS middleware – this also handles OPTIONS preflight automatically
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// -------------------- REST API routes --------------------
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/headchef', headchefRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/dietician', dieticianRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/', (_req, res) => {
  res.json({ message: 'Forgotten Recipes API is running!' });
});

// Catch‑all 404 handler – no '*' wildcard, just a regular middleware
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// -------------------- Create HTTP server --------------------
const server = http.createServer(app);

// -------------------- Socket.IO --------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', ({ userId, userRole }) => {
    if (userId) {
      onlineUsers.set(userId.toString(), { socketId: socket.id, role: userRole });
      socket.join(`user:${userId}`);
      io.emit('status', { userId, role: userRole, isOnline: true });
      console.log(`User ${userId} (${userRole}) is online`);
    }
  });

  socket.on('joinRoom', ({ conversationId }) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
    }
  });

  socket.on('leaveRoom', ({ conversationId }) => {
    if (conversationId) {
      socket.leave(conversationId);
    }
  });

  socket.on('typing', ({ conversationId, userId, userRole, isTyping }) => {
    socket.to(conversationId).emit('typing', { conversationId, senderId: userId, senderRole: userRole, isTyping });
  });

  socket.on('message', async (payload) => {
    try {
      const { conversationId, text, senderId, senderRole, senderName } = payload;
      if (!conversationId || !text || !senderRole) return;

      const message = await Message.create({
        conversation: conversationId,
        text,
        senderId: senderId || null,
        senderRole,
        senderName: senderName || 'User',
        read: false
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      io.to(conversationId).emit('message', {
        _id: message._id,
        conversation: conversationId,
        text: message.text,
        senderId: message.senderId,
        senderRole: message.senderRole,
        senderName: message.senderName,
        read: message.read,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('Socket message error:', err.message);
    }
  });

  socket.on('read', async ({ conversationId, userId }) => {
    try {
      await Message.updateMany(
        { conversation: conversationId, senderId: { $ne: userId }, read: false },
        { read: true }
      );
      io.to(conversationId).emit('messagesRead', { conversationId, userId });
    } catch (err) {
      console.error('Read receipt error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (let [userId, data] of onlineUsers.entries()) {
      if (data.socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
      io.emit('status', { userId: disconnectedUserId, isOnline: false });
      console.log(`User ${disconnectedUserId} went offline`);
    }
    console.log('Client disconnected:', socket.id);
  });
});

global.onlineUsers = onlineUsers;
global.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
  console.log(`📍 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});