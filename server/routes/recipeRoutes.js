
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getRecipes, getAllRecipes, createRecipe, updateRecipe, deleteRecipe,
  getRecipeWithNutrition, downloadNutritionReport,
  getComments, addComment, deleteComment,
  rateRecipe, getMyRating,
  downloadRecipePdf,
} = require('../controllers/recipeController');

// Lists
router.get('/', getRecipes);
router.get('/all', getAllRecipes);

// Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// Ratings
router.post('/:id/ratings', protect, rateRecipe);
router.get('/:id/ratings/me', protect, getMyRating);

// PDFs 
router.get('/:id/recipe-pdf', protect, downloadRecipePdf);
router.get('/:id/nutrition-report', protect, downloadNutritionReport);

// Detail
router.get('/:id', getRecipeWithNutrition);

// CRUD
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

module.exports = router;
