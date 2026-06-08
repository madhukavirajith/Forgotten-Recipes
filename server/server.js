const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const notificationRoutes = require('./routes/notificationRoutes');
const sanitize = require('./middleware/sanitize');

// Models used by Socket.IO
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const { createNotification } = require('./controllers/notificationController');

dotenv.config();
connectDB();

// Production warning for weak JWT secret
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'your_jwt_secret') {
  console.error('\n======================================================================\n[CRITICAL SECURITY WARNING] The default weak JWT_SECRET is being used in a production environment! Please configure a strong, unique secret key via environment variables.\n======================================================================\n');
}

const app = express();

// -------------------- CORS --------------------
const allowedOrigins = [
  'http://localhost:3000',
  'https://forgotten-recipes.vercel.app'
];

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

// -------------------- Security Middleware --------------------
// Helmet – sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: false, // Disable if you need inline scripts (adjust as needed)
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting – prevent brute force / DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});
// Apply to all API routes
app.use('/api/', limiter);

// Stricter limiter for auth endpoints (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { error: 'Too many login attempts, please try again later.' },
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);


// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitize);

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
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/', (_req, res) => {
  res.json({ message: 'Forgotten Recipes API is running!' });
});

// Catch‑all 404 handler
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

const onlineUsers = new Map(); // userId -> { sockets: Set, role: string }

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', ({ userId, userRole }) => {
    if (userId) {
      const userIdStr = userId.toString();
      const existing = onlineUsers.get(userIdStr);

      if (existing) {
        // Add this socket to the existing user's socket set
        existing.sockets.add(socket.id);
      } else {
        // Create new entry for this user
        onlineUsers.set(userIdStr, {
          sockets: new Set([socket.id]),
          role: userRole
        });
        io.emit('status', { userId, role: userRole, isOnline: true });
        console.log(`User ${userId} (${userRole}) is online`);
      }

      socket.join(`user:${userId}`);
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

      // Notify offline recipients about new message
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const onlineUserIds = Array.from(onlineUsers.keys());

          for (const participant of conversation.participants) {
            // Don't notify the sender
            if (participant.userId.toString() === senderId?.toString()) continue;

            // Check if user is offline
            const isOnline = onlineUserIds.includes(participant.userId.toString());
            if (!isOnline) {
              await createNotification(
                participant.userId,
                'New Message',
                `${senderName} sent you a message: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
                'chat_message',
                '/chat',
                { referenceId: conversationId.toString(), senderName }
              );
            }
          }
        }
      } catch (notifyErr) {
        console.error('Failed to notify offline users:', notifyErr);
      }
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
      if (data.sockets.has(socket.id)) {
        data.sockets.delete(socket.id);
        disconnectedUserId = userId;

        // If no more sockets for this user, mark as offline
        if (data.sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('status', { userId, isOnline: false });
          console.log(`User ${userId} went offline`);
        }
        break;
      }
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