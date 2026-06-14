const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: false },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: false },
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    text:   { type: String, required: true, trim: true, maxlength: 2000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // For nested replies
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      type: { type: String, enum: ['like', 'love', 'laugh', 'angry', 'sad'], required: true }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
