const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    value:  { type: Number, min: 1, max: 5, required: true }
  },
  { timestamps: true }
);


ratingSchema.index(
  { recipe: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

module.exports = mongoose.model('Rating', ratingSchema);
