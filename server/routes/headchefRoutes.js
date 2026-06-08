
const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const Recipe = require('../models/Recipe');
const { protect, allowRoles } = require('../middleware/auth');

const {
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
} = require('../controllers/headchefController');

// Secure all headchef routes
router.use(protect, allowRoles('admin', 'headchef'));

// Pending visitor recipes
router.get('/pending-recipes', getPendingRecipes);
router.put('/approve-recipe/:id', approveRecipe);
router.put('/reject-recipe/:id', rejectRecipe);

/* ---------------- Western Twist moderation ---------------- */
// List pending twisted recipes
router.get('/pending-twists', async (_req, res) => {
  try {
    const items = await Recipe.find({ isTwist: true, status: 'pending' })
      .populate('parentRecipe', 'name')
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approve a twisted recipe
router.put('/approve-twist/:id', async (req, res) => {
  try {
    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approved: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Twist not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reject a twisted recipe
router.put('/reject-twist/:id', async (req, res) => {
  try {
    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approved: false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Twist not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
