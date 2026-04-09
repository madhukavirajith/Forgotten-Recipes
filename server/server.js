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

// Models used by Socket.IO handlers
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

dotenv.config();
connectDB();

const app = express();

// --- Updated CORS Configuration ---
// Only include origins that actually exist and you control.
// For production, it's best to use environment variables.
const allowedOrigins = [
  'http://localhost:3000',               // Local React dev server
  'https://forgotten-recipes.vercel.app' // Your production frontend on Vercel
];

// Allow your Render backend's own URL for same-origin requests if needed, but it's not typical for a browser to send a different origin.
// A more flexible approach for development vs. production is shown below.

app.use(cors({
  origin: function(origin, callback){
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or if the origin is in our allowed list
    if(!origin || allowedOrigins.includes(origin)){
      callback(null, true);
    } else {
      console.warn(`Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsers
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
  res.json({
    message: 'Forgotten Recipes API is running!',
    roles: {
      visitors: 'Can register and login freely',
      admin: 'Pre-existing system role',
      headchef: 'Pre-existing system role',
      dietician: 'Pre-existing system role',
    },
  });
});

// -------------------- CREATE HTTP SERVER FIRST --------------------
const server = http.createServer(app);

// -------------------- THEN INITIALIZE SOCKET.IO --------------------
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, // Use the same allowed origins list for Socket.IO
    credentials: true 
  },
});

// Simple room-based chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join', ({ conversationId }) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
    }
  });

  socket.on('message', async (payload) => {
    try {
      if (!payload?.conversationId || !payload?.text || !payload?.senderRole) return;

      const msg = await Message.create({
        conversation: payload.conversationId,
        text: payload.text,
        senderId: payload.senderId || null,
        senderRole: payload.senderRole,
      });

      await Conversation.findByIdAndUpdate(payload.conversationId, {
        $set: { updatedAt: new Date() },
      });

      io.to(payload.conversationId).emit('message', msg);
    } catch (e) {
      console.error('Socket message error:', e?.message || e);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// -------------------- START SERVER LAST --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
  console.log(`📍 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});