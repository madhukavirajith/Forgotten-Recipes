// controllers/chatController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // assuming you have User model

// Role-based permissions (who can chat with whom)
const CHAT_PERMISSIONS = {
  visitor: ['dietician', 'headchef'],
  dietician: ['visitor', 'admin'],
  headchef: ['visitor', 'admin'],
  admin: ['headchef', 'dietician']
};

// Get available recipients for a user
exports.getAvailableRecipients = async (req, res) => {
  try {
    const userRole = req.user.role; // from auth middleware
    const userId = req.user.id;
    const allowedRoles = CHAT_PERMISSIONS[userRole] || [];

    // Find online users (you need to maintain online users in memory, see socket setup)
    // For now, return all staff users with allowed roles (simplified)
    const recipients = await User.find({
      role: { $in: allowedRoles },
      _id: { $ne: userId }
    }).select('_id name role');

    // You'll also need to check online status (see socket part)
    // We'll mark them as online if they have active socket connection
    const onlineUserIds = global.onlineUsers ? Array.from(global.onlineUsers.keys()) : [];
    const result = recipients.map(r => ({
      id: r._id,
      name: r.name,
      role: r.role,
      isOnline: onlineUserIds.includes(r._id.toString())
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get recent conversations for a user
exports.getRecentConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    const result = await Promise.all(conversations.map(async (conv) => {
      const other = conv.participants.find(p => p.userId.toString() !== userId);
      const lastMsg = await Message.findOne({ conversation: conv._id }).sort({ createdAt: -1 });
      return {
        id: conv._id,
        recipientId: other.userId,
        recipientName: other.name,
        recipientRole: other.role,
        lastMessage: lastMsg?.text || '',
        updatedAt: conv.updatedAt
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Start a conversation (create or get existing)
exports.startConversation = async (req, res) => {
  try {
    const { userId, userRole, userName, recipientId, recipientRole, recipientName } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [userId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId, role: userRole, name: userName },
          { userId: recipientId, role: recipientRole, name: recipientName }
        ]
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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