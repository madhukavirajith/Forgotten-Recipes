// controllers/chatController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Rate limiting cache (in production, use Redis)
const messageRateLimit = new Map();

// Role-based permissions (who can chat with whom)
const CHAT_PERMISSIONS = {
  visitor: ['dietician', 'headchef'],
  dietician: ['visitor', 'admin'],
  headchef: ['visitor', 'admin'],
  admin: ['headchef', 'dietician']
};

// Rate limiting helper
const checkRateLimit = (userId) => {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  const userMessages = messageRateLimit.get(userId) || [];

  // Remove old messages outside the window
  const recentMessages = userMessages.filter(timestamp => timestamp > windowStart);

  if (recentMessages.length >= 30) { // 30 messages per minute
    return false;
  }

  recentMessages.push(now);
  messageRateLimit.set(userId, recentMessages);
  return true;
};

// Get available recipients for a user with online status
exports.getAvailableRecipients = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id || req.user.id;
    const allowedRoles = CHAT_PERMISSIONS[userRole] || [];

    if (!allowedRoles.length) {
      return res.json([]);
    }

    // Get all allowed users
    const recipients = await User.find({
      role: { $in: allowedRoles },
      _id: { $ne: userId },
      isActive: { $ne: false } // Exclude deactivated users
    }).select('_id name role lastActive').lean();

    // Check online status
    const onlineUserIds = global.onlineUsers ? Array.from(global.onlineUsers.keys()) : [];

    const result = recipients.map(recipient => ({
      id: recipient._id,
      name: recipient.name,
      role: recipient.role,
      isOnline: onlineUserIds.includes(recipient._id.toString()),
      lastActive: recipient.lastActive
    }));

    // Sort by online status first, then by name
    result.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return b.isOnline - a.isOnline;
      return a.name.localeCompare(b.name);
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching recipients:', err);
    res.status(500).json({ error: 'Failed to load recipients' });
  }
};

// Get recent conversations with optimized queries
exports.getRecentConversations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    // Use aggregation for better performance
    const conversations = await Conversation.aggregate([
      {
        $match: {
          'participants.userId': userId,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$conversation', '$$convId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
          unreadCount: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$unreadCount',
                  cond: { $eq: ['$$this.userId', userId] }
                }
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          participants: 1,
          conversationType: 1,
          title: 1,
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: { $ifNull: ['$unreadCount.count', 0] },
          updatedAt: 1
        }
      },
      { $sort: { lastMessageAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    // Get other participant info
    const result = await Promise.all(conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(p => p.userId.toString() !== userId.toString());
      const isOnline = global.onlineUsers ? global.onlineUsers.has(otherParticipant.userId.toString()) : false;

      return {
        id: conv._id,
        recipientId: otherParticipant.userId,
        recipientName: otherParticipant.name,
        recipientRole: otherParticipant.role,
        isOnline,
        lastMessage: conv.lastMessage?.text || '',
        lastMessageAt: conv.lastMessage?.createdAt || conv.lastMessageAt,
        unreadCount: conv.unreadCount || 0,
        conversationType: conv.conversationType,
        title: conv.title
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};

// Start or get existing conversation
exports.startConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userName = req.user.name;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID required' });
    }

    // Validate recipient exists and is allowed
    const recipient = await User.findById(recipientId).select('name role');
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const allowedRoles = CHAT_PERMISSIONS[userRole] || [];
    if (!allowedRoles.includes(recipient.role)) {
      return res.status(403).json({ error: 'Not authorized to chat with this user' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [userId, recipientId] },
      conversationType: 'direct',
      isActive: true
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId, role: userRole, name: userName },
          { userId: recipientId, role: recipient.role, name: recipient.name }
        ],
        conversationType: 'direct',
        createdBy: userId
      });
      await conversation.save();
    }

    res.json({
      _id: conversation._id,
      participants: conversation.participants,
      conversationType: conversation.conversationType,
      createdAt: conversation.createdAt
    });
  } catch (err) {
    console.error('Error starting conversation:', err);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
};

// Get paginated message history with search
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const search = req.query.search?.trim();

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    // Build query
    const query = { conversation: conversationId };
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    // Get messages with pagination
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name')
      .populate('replyTo', 'text senderName')
      .lean();

    // Reverse to chronological order
    messages.reverse();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments(query);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id || req.user.id;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark conversation as read for user
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

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking as read:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Send message with validation and rate limiting
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, messageType, replyTo, fileUrl, fileName, fileSize } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userName = req.user.name;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Too many messages. Please slow down.' });
    }

    // Validate input
    if (!conversationId || !text?.trim()) {
      return res.status(400).json({ error: 'Message text required' });
    }

    if (text.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to send messages here' });
    }

    // Validate replyTo if provided
    if (replyTo) {
      const replyMessage = await Message.findOne({
        _id: replyTo,
        conversation: conversationId
      });
      if (!replyMessage) {
        return res.status(400).json({ error: 'Reply message not found' });
      }
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      senderId: userId,
      senderRole: userRole,
      senderName: userName,
      text: text.trim(),
      messageType: messageType || 'text',
      fileUrl,
      fileName,
      fileSize,
      replyTo,
      status: 'sent'
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = {
      text: message.text,
      senderId: userId,
      senderName: userName,
      messageType: message.messageType,
      createdAt: message.createdAt
    };
    conversation.lastMessageAt = message.createdAt;
    conversation.messageCount += 1;

    // Update unread counts for other participants
    conversation.participants.forEach(participant => {
      if (participant.userId.toString() !== userId.toString()) {
        conversation.updateUnreadCount(participant.userId, true);
      }
    });

    await conversation.save();

    // Populate and return
    await message.populate('senderId', 'name');
    if (message.replyTo) {
      await message.populate('replyTo', 'text senderName');
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id || req.user.id;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Message text required' });
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }

    // Only allow editing within 15 minutes
    const timeDiff = Date.now() - message.createdAt.getTime();
    if (timeDiff > 15 * 60 * 1000) {
      return res.status(400).json({ error: 'Messages can only be edited within 15 minutes' });
    }

    message.text = text.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json(message);
  } catch (err) {
    console.error('Error editing message:', err);
    res.status(500).json({ error: 'Failed to edit message' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id || req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }

    // Mark as deleted (soft delete)
    message.text = '[Message deleted]';
    message.messageType = 'system';
    await message.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id || req.user.id;

    if (!emoji || emoji.length > 10) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());

    // Add new reaction
    message.reactions.push({
      userId,
      emoji,
      createdAt: new Date()
    });

    await message.save();
    await message.populate('reactions.userId', 'name');

    res.json(message);
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id || req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());
    await message.save();

    res.json(message);
  } catch (err) {
    console.error('Error removing reaction:', err);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

// Search messages in conversation
exports.searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;
    const userId = req.user._id || req.user.id;

    if (!query?.trim()) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      text: { $regex: query.trim(), $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name')
      .lean();

    const total = await Message.countDocuments({
      conversation: conversationId,
      text: { $regex: query.trim(), $options: 'i' }
    });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error searching messages:', err);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

// Get message history
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    await Message.updateMany(
      { conversation: conversationId, senderId: { $ne: userId }, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};