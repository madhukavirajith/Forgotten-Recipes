
const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');

const {
  getRecipes, getAllRecipes, createRecipe, updateRecipe, deleteRecipe,
  getRecipeWithNutrition, downloadNutritionReport,
  getComments, addComment, deleteComment, editComment, addCommentReaction, removeCommentReaction,
  rateRecipe, getMyRating,
  downloadRecipePdf,
} = require('../controllers/recipeController');

// Lists
router.get('/', getRecipes);
router.get('/all', protect, allowRoles('admin', 'headchef'), getAllRecipes);

// Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.put('/:id/comments/:commentId', protect, editComment);
router.post('/:id/comments/:commentId/react', protect, addCommentReaction);
router.delete('/:id/comments/:commentId/react', protect, removeCommentReaction);
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
router.post('/', protect, allowRoles('admin', 'headchef'), createRecipe);
router.put('/:id', protect, allowRoles('admin', 'headchef'), updateRecipe);
router.delete('/:id', protect, allowRoles('admin', 'headchef'), deleteRecipe);

module.exports = router;
