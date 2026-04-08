
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['visitor', 'dietician', 'headchef', 'admin'],
      default: 'visitor',
    },
    phone: { type: String },
    dob: { type: Date },
    address: { type: String },

    
    cookbook: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    myRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


