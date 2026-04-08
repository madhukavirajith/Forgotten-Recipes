
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    type:   { type: String, enum: ['content', 'abuse', 'bug', 'other'], default: 'other' },
    message:{ type: String, required: true, trim: true, maxlength: 4000 },
    status: { type: String, enum: ['open', 'in-progress', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
