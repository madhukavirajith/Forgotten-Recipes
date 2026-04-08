
const express = require('express');
const {
  getPendingRecipes,
  getOneRecipe,
  saveNutrition,
  addTags,
  removeTag,
} = require('../controllers/dieticianController');

const router = express.Router();


router.get('/pending', getPendingRecipes);
router.get('/recipes/:id', getOneRecipe);
router.put('/recipes/:id/nutrition', saveNutrition);
router.post('/recipes/:id/tags', addTags);
router.delete('/recipes/:id/tags', removeTag);

module.exports = router;
