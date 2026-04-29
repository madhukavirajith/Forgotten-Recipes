// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderRole: { type: String, enum: ['visitor', 'dietician', 'headchef', 'admin'], required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  messageType: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  readBy: [{ userId: mongoose.Schema.Types.ObjectId, readAt: Date }],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, maxlength: 10 },
    createdAt: { type: Date, default: Date.now }
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  status: { type: String, enum: ['sending', 'sent', 'delivered', 'read', 'failed'], default: 'sent' },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

// Pre-save middleware
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for delivery status
messageSchema.virtual('isDelivered').get(function() {
  return this.readBy && this.readBy.length > 0;
});

messageSchema.virtual('isRead').get(function() {
  return this.readBy && this.readBy.some(read => read.userId.toString() !== this.senderId.toString());
});

module.exports = mongoose.model('Message', messageSchema);