const Recipe = require('../models/Recipe');


function buildPendingFilter() {
  return {
    $and: [
      { $or: [{ approved: { $eq: false } }, { status: 'pending' }] },
      { submittedBy: { $exists: true, $ne: null } }, // must be a visitor submission
    ],
  };
}

// GET /api/headchef/pending-recipes
exports.getPendingRecipes = async (req, res) => {
  try {
    const pending = await Recipe.find(buildPendingFilter())
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || 'Failed to fetch pending recipes' });
  }
};

// PUT /api/headchef/approve-recipe/:id
exports.approveRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.approved = true;
    recipe.status = 'approved';
    await recipe.save();

    res.json({ message: 'Recipe approved and published', recipe });
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || 'Failed to approve recipe' });
  }
};

// PUT /api/headchef/reject-recipe/:id
exports.rejectRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.approved = false;
    recipe.status = 'rejected';
    await recipe.save();

    res.json({ message: 'Recipe rejected', recipe });
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || 'Failed to reject recipe' });
  }
};



