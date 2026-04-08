
const Recipe = require('../models/Recipe');


const getPendingRecipes = async (req, res) => {
  try {
    const items = await Recipe.find({
      $or: [
        { 'nutrition.calories': { $exists: false } },
        { 'nutrition.calories': 0 }
      ]
    })
      .sort({ createdAt: -1 })
      .select('name createdAt nutrition tags');

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};


const getOneRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).select('title name nutrition tags createdAt');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};


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
      { $set: { nutrition: { calories, protein, carbs, fat, vitamins, ratingFlag, benefits } } },
      { new: true }
    ).select('title name nutrition tags');

    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};


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
    res.status(500).json({ message: err.message || 'Server error' });
  }
};


const removeTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { $pull: { tags: tag } },
      { new: true }
    ).select('tags');

    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ tags: recipe.tags });
  } catch (err) {
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
