// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['visitor', 'dietician', 'headchef', 'admin'], required: true },
    name: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
  }],
  conversationType: { type: String, enum: ['direct', 'group'], default: 'direct' },
  title: { type: String }, // For group chats
  description: { type: String },
  lastMessage: {
    text: { type: String, default: '' },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String },
    messageType: { type: String, default: 'text' },
    createdAt: { type: Date }
  },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  messageCount: { type: Number, default: 0 },
  unreadCount: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Indexes for performance
conversationSchema.index({ 'participants.userId': 1, updatedAt: -1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ createdAt: -1 });

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to update unread count
conversationSchema.methods.updateUnreadCount = function(userId, increment = true) {
  const unreadEntry = this.unreadCount.find(entry => entry.userId.toString() === userId.toString());
  if (unreadEntry) {
    unreadEntry.count = increment ? unreadEntry.count + 1 : Math.max(0, unreadEntry.count - 1);
  } else if (increment) {
    this.unreadCount.push({ userId, count: 1 });
  }
};

// Method to mark as read for user
conversationSchema.methods.markAsRead = function(userId) {
  const unreadEntry = this.unreadCount.find(entry => entry.userId.toString() === userId.toString());
  if (unreadEntry) {
    unreadEntry.count = 0;
  }
  // Update participant's last seen
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.lastSeen = new Date();
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);