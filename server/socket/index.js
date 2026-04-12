// socket/index.js
const socketIO = require('socket.io');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Store online users: Map<userId, { socketId, role }>
const onlineUsers = new Map();

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', async ({ conversationId, userId, userRole }) => {
      // Store user online status
      onlineUsers.set(userId, { socketId: socket.id, role: userRole });
      socket.join(conversationId);
      
      // Broadcast online status to all clients
      io.emit('status', { userId, role: userRole, isOnline: true });
    });

    socket.on('leave', ({ conversationId, userId }) => {
      socket.leave(conversationId);
    });

    socket.on('typing', ({ conversationId, userId, userRole, isTyping }) => {
      socket.to(conversationId).emit('typing', { conversationId, senderId: userId, senderRole: userRole, isTyping });
    });

    socket.on('message', async ({ conversationId, text, senderId, senderRole, senderName }) => {
      // Save message to database
      const message = new Message({
        conversation: conversationId,
        senderId,
        senderRole,
        senderName,
        text
      });
      await message.save();

      // Update conversation last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      // Emit message to everyone in the room (including sender)
      io.to(conversationId).emit('message', {
        _id: message._id,
        conversation: conversationId,
        text,
        senderId,
        senderRole,
        senderName,
        read: false,
        createdAt: message.createdAt
      });
    });

    socket.on('disconnect', () => {
      // Remove from online users
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
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make onlineUsers available globally (for controller)
  global.onlineUsers = onlineUsers;
};