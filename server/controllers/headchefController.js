const Recipe = require('../models/Recipe');
const { createNotification } = require('./notificationController');


function buildPendingFilter() {
  return {
    status: 'pending',
    submittedBy: { $exists: true, $ne: null }, // must be a visitor submission
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

    // Notify the recipe submitter
    if (recipe.submittedBy) {
      createNotification(
        recipe.submittedBy,
        'Recipe Approved',
        `Your recipe "${recipe.name}" has been approved and is now live!`,
        'recipe_approval',
        `/recipes/${recipe._id}`,
        { referenceId: recipe._id }
      ).catch((err) => {
        console.error('Failed to create approval notification:', err);
      });
    }

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

    // Notify the recipe submitter about rejection
    if (recipe.submittedBy) {
      createNotification(
        recipe.submittedBy,
        'Recipe Rejected',
        `Your recipe "${recipe.name}" was not approved. Please review and resubmit.`,
        'recipe_rejection',
        `/visitor`,
        { referenceId: recipe._id }
      ).catch((err) => {
        console.error('Failed to create rejection notification:', err);
      });
    }

    res.json({ message: 'Recipe rejected', recipe });
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || 'Failed to reject recipe' });
  }
};



