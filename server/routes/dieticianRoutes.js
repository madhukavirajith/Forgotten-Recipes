
const express = require('express');
const { protect, allowRoles } = require('../middleware/auth');
const {
  getPendingRecipes,
  getOneRecipe,
  saveNutrition,
  addTags,
  removeTag,
} = require('../controllers/dieticianController');

const router = express.Router();

// Apply auth middleware to all dietician routes
router.use(protect, allowRoles('admin', 'dietician'));


router.get('/pending', getPendingRecipes);
router.get('/recipes/:id', getOneRecipe);
router.put('/recipes/:id/nutrition', saveNutrition);
router.post('/recipes/:id/tags', addTags);
router.delete('/recipes/:id/tags', removeTag);

module.exports = router;
