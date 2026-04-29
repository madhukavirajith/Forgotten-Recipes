// socket/index.js
const socketIO = require('socket.io');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Store online users: Map<userId, { socketId, role, lastActive }>
const onlineUsers = new Map();

// Typing indicators: Map<conversationId, Map<userId, timeout>>
const typingUsers = new Map();

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', async ({ conversationId, userId, userRole, userName }) => {
      try {
        // Store user online status
        onlineUsers.set(userId, {
          socketId: socket.id,
          role: userRole,
          name: userName,
          lastActive: new Date()
        });

        socket.join(conversationId);

        // Update user's last active time
        await User.findByIdAndUpdate(userId, { lastActive: new Date() });

        // Broadcast online status to all clients
        io.emit('status', {
          userId,
          role: userRole,
          name: userName,
          isOnline: true,
          lastActive: new Date()
        });

        // Send conversation participants online status
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const onlineParticipants = conversation.participants
            .filter(p => onlineUsers.has(p.userId.toString()))
            .map(p => ({
              userId: p.userId,
              role: p.role,
              name: p.name,
              isOnline: true
            }));

          socket.emit('participants_online', onlineParticipants);
        }
      } catch (err) {
        console.error('Error in join:', err);
      }
    });

    socket.on('leave', ({ conversationId, userId }) => {
      socket.leave(conversationId);
    });

    socket.on('typing', ({ conversationId, userId, userRole, userName, isTyping }) => {
      // Manage typing indicators
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Map());
      }

      const conversationTyping = typingUsers.get(conversationId);

      if (isTyping) {
        // Set typing timeout (3 seconds)
        const timeout = setTimeout(() => {
          conversationTyping.delete(userId);
          socket.to(conversationId).emit('typing', {
            conversationId,
            userId,
            userRole,
            userName,
            isTyping: false
          });
        }, 3000);

        conversationTyping.set(userId, timeout);
      } else {
        // Clear typing
        if (conversationTyping.has(userId)) {
          clearTimeout(conversationTyping.get(userId));
          conversationTyping.delete(userId);
        }
      }

      // Broadcast typing status
      socket.to(conversationId).emit('typing', {
        conversationId,
        userId,
        userRole,
        userName,
        isTyping
      });
    });

    socket.on('message', async (messageData) => {
      try {
        const {
          conversationId,
          text,
          senderId,
          senderRole,
          senderName,
          messageType = 'text',
          replyTo,
          fileUrl,
          fileName,
          fileSize
        } = messageData;

        // Validate message
        if (!text?.trim() && messageType === 'text') {
          socket.emit('error', { type: 'validation', message: 'Message text required' });
          return;
        }

        // Create and save message
        const message = new Message({
          conversation: conversationId,
          senderId,
          senderRole,
          senderName,
          text: text?.trim(),
          messageType,
          replyTo,
          fileUrl,
          fileName,
          fileSize,
          status: 'sent'
        });

        await message.save();

        // Update conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = {
            text: message.text,
            senderId,
            senderName,
            messageType,
            createdAt: message.createdAt
          };
          conversation.lastMessageAt = message.createdAt;
          conversation.messageCount += 1;

          // Update unread counts for other participants
          conversation.participants.forEach(participant => {
            if (participant.userId.toString() !== senderId.toString()) {
              conversation.updateUnreadCount(participant.userId, true);
            }
          });

          await conversation.save();
        }

        // Populate message data
        await message.populate('senderId', 'name');
        if (message.replyTo) {
          await message.populate('replyTo', 'text senderName');
        }

        // Emit message to conversation
        io.to(conversationId).emit('message', message);

        // Emit conversation update to all participants
        conversation.participants.forEach(participant => {
          const participantSocket = onlineUsers.get(participant.userId.toString());
          if (participantSocket) {
            io.to(participantSocket.socketId).emit('conversation_update', {
              conversationId,
              lastMessage: conversation.lastMessage,
              lastMessageAt: conversation.lastMessageAt,
              unreadCount: conversation.unreadCount.find(u => u.userId.toString() === participant.userId.toString())?.count || 0
            });
          }
        });

      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', { type: 'server', message: 'Failed to send message' });
      }
    });

    socket.on('edit_message', async ({ messageId, text, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { type: 'not_found', message: 'Message not found' });
          return;
        }

        // Check if user can edit (only sender, within time limit)
        if (message.senderId.toString() !== socket.userId) {
          socket.emit('error', { type: 'unauthorized', message: 'Cannot edit this message' });
          return;
        }

        const timeDiff = Date.now() - message.createdAt.getTime();
        if (timeDiff > 15 * 60 * 1000) { // 15 minutes
          socket.emit('error', { type: 'expired', message: 'Edit time expired' });
          return;
        }

        message.text = text.trim();
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        // Emit update to conversation
        io.to(conversationId).emit('message_edited', {
          messageId,
          text: message.text,
          edited: true,
          editedAt: message.editedAt
        });

      } catch (err) {
        console.error('Error editing message:', err);
        socket.emit('error', { type: 'server', message: 'Failed to edit message' });
      }
    });

    socket.on('delete_message', async ({ messageId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { type: 'not_found', message: 'Message not found' });
          return;
        }

        // Check if user can delete (only sender)
        if (message.senderId.toString() !== socket.userId) {
          socket.emit('error', { type: 'unauthorized', message: 'Cannot delete this message' });
          return;
        }

        message.text = '[Message deleted]';
        message.messageType = 'system';
        await message.save();

        // Emit deletion to conversation
        io.to(conversationId).emit('message_deleted', { messageId });

      } catch (err) {
        console.error('Error deleting message:', err);
        socket.emit('error', { type: 'server', message: 'Failed to delete message' });
      }
    });

    socket.on('add_reaction', async ({ messageId, emoji, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { type: 'not_found', message: 'Message not found' });
          return;
        }

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(r =>
          r.userId.toString() !== socket.userId
        );

        // Add new reaction
        message.reactions.push({
          userId: socket.userId,
          emoji,
          createdAt: new Date()
        });

        await message.save();
        await message.populate('reactions.userId', 'name');

        // Emit reaction update to conversation
        io.to(conversationId).emit('reaction_added', {
          messageId,
          reactions: message.reactions
        });

      } catch (err) {
        console.error('Error adding reaction:', err);
        socket.emit('error', { type: 'server', message: 'Failed to add reaction' });
      }
    });

    socket.on('remove_reaction', async ({ messageId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { type: 'not_found', message: 'Message not found' });
          return;
        }

        message.reactions = message.reactions.filter(r =>
          r.userId.toString() !== socket.userId
        );

        await message.save();

        // Emit reaction update to conversation
        io.to(conversationId).emit('reaction_removed', {
          messageId,
          reactions: message.reactions
        });

      } catch (err) {
        console.error('Error removing reaction:', err);
        socket.emit('error', { type: 'server', message: 'Failed to remove reaction' });
      }
    });

    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Mark as read
        conversation.markAsRead(userId);
        await conversation.save();

        // Update message read status
        await Message.updateMany(
          {
            conversation: conversationId,
            senderId: { $ne: userId },
            'readBy.userId': { $ne: userId }
          },
          {
            $push: {
              readBy: { userId, readAt: new Date() }
            }
          }
        );

        // Emit read status to conversation
        io.to(conversationId).emit('messages_read', {
          conversationId,
          userId,
          readAt: new Date()
        });

      } catch (err) {
        console.error('Error marking as read:', err);
      }
    });

    socket.on('disconnect', () => {
      // Remove from online users
      let disconnectedUserId = null;
      let disconnectedUserData = null;

      for (let [userId, data] of onlineUsers.entries()) {
        if (data.socketId === socket.id) {
          disconnectedUserId = userId;
          disconnectedUserData = data;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        // Update last active time
        User.findByIdAndUpdate(disconnectedUserId, { lastActive: new Date() }).catch(err =>
          console.error('Error updating last active:', err)
        );

        // Broadcast offline status
        io.emit('status', {
          userId: disconnectedUserId,
          role: disconnectedUserData.role,
          name: disconnectedUserData.name,
          isOnline: false,
          lastActive: new Date()
        });
      }

      console.log('Client disconnected:', socket.id);
    });
  });

  // Make onlineUsers available globally (for controller)
  global.onlineUsers = onlineUsers;

  return io;
};