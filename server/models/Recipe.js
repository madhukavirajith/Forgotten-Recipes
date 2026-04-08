
const mongoose = require('mongoose');


const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 }, 
    carbs:   { type: Number, default: 0 }, 
    fat:     { type: Number, default: 0 }, 
    vitamins: [{ name: String, amount: String }],
    ratingFlag: {
      type: String,
      enum: ['weight-loss', 'neutral', 'weight-gain'],
      default: 'neutral'
    },
    benefits: [String],
  },
  { _id: false }
);

const substitutionSchema = new mongoose.Schema(
  {
    from: { type: String, trim: true },
    to:   { type: String, trim: true },
  },
  { _id: false }
);


const recipeSchema = new mongoose.Schema(
  {
    // Core
    name: { type: String, required: true, trim: true },
    ingredients: { type: String, required: true },
    instructions: { type: String, required: true },
    culture: { type: String, default: '' },
    image: { type: String }, // base64 or URL

    // Visitor-facing filters
    category: {
      type: String,
      enum: ['Main Course', 'Snack', 'Dessert', 'Beverage'],
    },
    spiceLevel: {
      type: String,
      enum: ['Mild', 'Medium', 'Spicy'],
    },
    dietType: {
      type: String,
      enum: ['Vegan', 'Vegetarian', 'Non-Vegetarian'],
    },

    // Dietician data / labels
    nutrition: nutritionSchema,
    tags: [{ type: String, trim: true }],

    // Summaries (for fast list rendering)
    averageRating: { type: Number, default: 0 },   // 0–5
    ratingsCount:  { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    // Approval flow
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approved: { type: Boolean, default: false }, // keep in sync with status
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Western Twist
    isTwist: { type: Boolean, default: false },
    parentRecipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    substitutions: [substitutionSchema],
  },
  { timestamps: true }
);


recipeSchema.index({ approved: 1, createdAt: -1 });
recipeSchema.index({ isTwist: 1, status: 1, updatedAt: -1 });


recipeSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.approved = this.status === 'approved';
  }
  if (this.isTwist && !this.tags?.includes('Twisted')) {
    this.tags = Array.from(new Set([...(this.tags || []), 'Twisted']));
  }
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);
