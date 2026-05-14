// server/controllers/dieticianController.js
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { createNotification } = require('./notificationController'); // adjust path if needed

// Get all approved recipes that still need nutrition information
const getPendingRecipes = async (req, res) => {
  try {
    // Only show approved recipes (status: 'approved' or approved: true)
    // AND that are missing the nutrition object OR have calories = 0
    const items = await Recipe.find({
      $or: [{ status: 'approved' }, { approved: true }],
      $or: [
        { 'nutrition.calories': { $exists: false } },
        { 'nutrition.calories': 0 }
      ]
    })
      .sort({ createdAt: -1 })
      .select('name createdAt nutrition tags');

    res.json({ items });
  } catch (err) {
    console.error('Error fetching pending recipes:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Get a single recipe (for editing)
const getOneRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).select('name nutrition tags createdAt');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    console.error('Error fetching recipe:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Save or update nutrition data for a recipe
const saveNutrition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      vitamins = [],
      ratingFlag = 'neutral',
      benefits = []
    } = req.body;

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      {
        $set: {
          nutrition: { calories, protein, carbs, fat, vitamins, ratingFlag, benefits }
        }
      },
      { new: true }
    ).select('name nutrition tags submittedBy');

    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Notify the recipe submitter that nutrition has been added
    if (recipe.submittedBy) {
      try {
        await createNotification(
          recipe.submittedBy,
          'Nutrition Information Added',
          `Nutrition details have been added to your recipe "${recipe.name}".`
        );
      } catch (notifyErr) {
        console.error('Failed to send notification:', notifyErr);
      }
    }

    res.json(recipe);
  } catch (err) {
    console.error('Error saving nutrition:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Add tags to a recipe
const addTags = async (req, res) => {
  try {
    const { id } = req.params;
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    ).select('tags');

    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ tags: recipe.tags });
  } catch (err) {
    console.error('Error adding tags:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Remove a single tag from a recipe
const removeTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ message: 'Tag is required' });

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { $pull: { tags: tag } },
      { new: true }
    ).select('tags');

    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ tags: recipe.tags });
  } catch (err) {
    console.error('Error removing tag:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = {
  getPendingRecipes,
  getOneRecipe,
  saveNutrition,
  addTags,
  removeTag,
};