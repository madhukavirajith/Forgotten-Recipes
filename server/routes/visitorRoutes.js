
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getCookbook,
  addToCookbook,
  removeFromCookbook,
  getMyRecipes,
  submitRecipe,
  // Western Twist
  twistSuggestions,
  createTwist,
} = require('../controllers/visitorController');

// -------------------- Cookbook --------------------
router.get('/cookbook', protect, getCookbook);
router.post('/cookbook/:recipeId', protect, addToCookbook);
router.delete('/cookbook/:recipeId', protect, removeFromCookbook);

// -------------------- My Recipes --------------------
router.get('/my-recipes', protect, getMyRecipes);
router.post('/submit-recipe', protect, submitRecipe);

// -------------------- Western Twist --------------------
router.get('/twist-suggestions', twistSuggestions); // Public
router.post('/twist/:recipeId', protect, createTwist);

module.exports = router;
