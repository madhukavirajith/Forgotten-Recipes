
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  targetRole: { type: String, enum: ['dietician', 'headchef'], required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

conversationSchema.index({ visitor: 1, targetRole: 1 }, { unique: true }); 

module.exports = mongoose.model('Conversation', conversationSchema);
