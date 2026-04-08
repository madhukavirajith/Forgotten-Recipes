
const express = require('express');
const router = express.Router();

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
router.get('/cookbook', getCookbook);
router.post('/cookbook/:recipeId', addToCookbook);
router.delete('/cookbook/:recipeId', removeFromCookbook);

// -------------------- My Recipes --------------------
router.get('/my-recipes', getMyRecipes);
router.post('/submit-recipe', submitRecipe);

// -------------------- Western Twist --------------------
router.get('/twist-suggestions', twistSuggestions);
router.post('/twist/:recipeId', createTwist);

module.exports = router;
