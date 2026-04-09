
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

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://forgotten-recipes.vercel.app'
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin || allowedOrigins.includes(origin)){
      callback(null, true);
    } else {
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
app.use('/api/feedback', feedbackRoutes); // <-- NEW

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

// -------------------- Socket.IO server --------------------
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,  // ✅ Use your existing allowedOrigins array
    credentials: true 
  },
});

// Simple room-based chat for Visitor <-> Dietician/Head Chef
io.on('connection', (socket) => {
  // Client joins a conversation room by its ID
  socket.on('join', ({ conversationId }) => {
    if (conversationId) socket.join(conversationId);
  });

  // Persist and broadcast a message
  // payload: { conversationId, text, senderId, senderRole: 'visitor'|'dietician'|'headchef' }
  socket.on('message', async (payload) => {
    try {
      if (!payload?.conversationId || !payload?.text || !payload?.senderRole) return;

      const msg = await Message.create({
        conversation: payload.conversationId,
        text: payload.text,
        senderId: payload.senderId || null,
        senderRole: payload.senderRole,
      });

      // keep the conversation "fresh" for inbox ordering
      await Conversation.findByIdAndUpdate(payload.conversationId, {
        $set: { updatedAt: new Date() },
      });

      io.to(payload.conversationId).emit('message', msg);
    } catch (e) {
      console.error('Socket message error:', e?.message || e);
    }
  });

  socket.on('disconnect', () => {
    // no-op
  });
});

// -------------------- Start server --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server + Socket.IO running on port ${PORT}`));
