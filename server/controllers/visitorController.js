
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

/* ------------------------------- helpers ------------------------------- */
const getUserIdFromToken = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    const err = new Error('Unauthorized: No token provided');
    err.code = 401;
    throw err;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id;
};

const CATEGORIES = ['Main Course', 'Snack', 'Dessert', 'Beverage'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy'];
const DIET_TYPES = ['Vegan', 'Vegetarian', 'Non-Vegetarian'];

/* ------------------------------ cookbook ------------------------------ */
exports.getCookbook = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findById(userId).populate('cookbook');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.cookbook || []);
  } catch (err) {
    res.status(err.code || 401).json({ error: err.message });
  }
};

exports.addToCookbook = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const recipeId = req.params.recipeId;

    const [user, recipe] = await Promise.all([
      User.findById(userId),
      Recipe.findById(recipeId),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    user.cookbook = user.cookbook || [];
    const exists = user.cookbook.some((id) => id.toString() === recipeId);
    if (!exists) {
      user.cookbook.push(recipeId);
      await user.save();
    }
    res.json({ message: 'Recipe added to cookbook' });
  } catch (err) {
    res.status(err.code || 401).json({ error: err.message });
  }
};

exports.removeFromCookbook = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const recipeId = req.params.recipeId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.cookbook = (user.cookbook || []).filter(
      (id) => id.toString() !== recipeId
    );
    await user.save();

    res.json({ message: 'Recipe removed from cookbook' });
  } catch (err) {
    res.status(err.code || 401).json({ error: err.message });
  }
};

/* ----------------------------- my recipes ----------------------------- */
exports.getMyRecipes = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findById(userId).populate('myRecipes');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.myRecipes || []);
  } catch (err) {
    res.status(err.code || 401).json({ error: err.message });
  }
};

/* --------------------------- submit recipe ---------------------------- */
exports.submitRecipe = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const {
      name,
      ingredients,
      instructions,
      image,
      culture,
      category,
      spiceLevel,
      dietType,
    } = req.body;

    if (!name || !ingredients || !instructions) {
      return res
        .status(400)
        .json({ error: 'Name, ingredients and instructions are required.' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!SPICE_LEVELS.includes(spiceLevel)) {
      return res.status(400).json({ error: 'Invalid spice level' });
    }
    if (!DIET_TYPES.includes(dietType)) {
      return res.status(400).json({ error: 'Invalid diet type' });
    }

    const newRecipe = new Recipe({
      name,
      ingredients,
      instructions,
      image,
      culture,
      category,
      spiceLevel,
      dietType,
      status: 'pending',
      approved: false,
      submittedBy: userId,
    });

    await newRecipe.save();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.myRecipes = user.myRecipes || [];
    user.myRecipes.push(newRecipe._id);
    await user.save();

    res.status(201).json({ message: 'Recipe submitted for approval' });
  } catch (err) {
    const status = err.code || (err.name === 'JsonWebTokenError' ? 401 : 400);
    res.status(status).json({ error: err.message });
  }
};

/* --------------------------- Sri Lankan → Western Subs --------------------------- */
// Substitution suggestions for traditional ingredients
const WESTERN_SUBS = {
  'goraka|kokum': ['tamarind paste', 'lemon juice'],
  'coconut oil': ['olive oil', 'canola oil'],
  'coconut milk': ['evaporated milk', 'heavy cream + water'],
  'maldive fish|sprats': ['anchovies'],
  'kurakkan flour|kurakkan (finger millet)': ['whole wheat flour', 'buckwheat'],
  'jackfruit (young)': ['canned green jackfruit', 'artichoke hearts'],
  'jackfruit seeds': ['chestnuts', 'broad beans'],
  'breadfruit|del|delum': ['potatoes', 'plantain'],
  'seer fish': ['cod', 'haddock', 'halibut'],
  'tuna': ['salmon', 'mackerel', 'cod'],
  'kithul treacle': ['maple syrup', 'honey'],
  'jaggery': ['brown sugar', 'molasses'],
  'gotukola': ['spinach', 'parsley'],
  'karapincha (curry leaves)': ['bay leaf + parsley'],
  'kohila (lasia tuber)': ['celery root', 'burdock root'],
  'kekiri (snake melon)|pathola (snake gourd)': ['zucchini', 'courgette'],
  'ambarella': ['green mango', 'plum'],
  'thambili (king coconut water)': ['coconut water', 'diluted fruit juice'],
  'sesame seeds': ['sunflower seeds', 'pumpkin seeds'],
  'mung flour (green gram)': ['chickpea flour', 'yellow split pea flour'],
  'rulang (semolina)': ['cream of wheat', 'coarse cornmeal'],
  'bibikkan spices (clove, cardamom)': ['pumpkin pie spice mix', 'allspice']
};

function parseLines(text = '') {
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

/* -------------------- Suggestions (public) -------------------- */
exports.twistSuggestions = async (_req, res) => {
  res.json({ map: WESTERN_SUBS });
};

/* -------------------- Create a Twisted copy (NO auto nutrition) -------------------- */
exports.createTwist = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { recipeId } = req.params;
    const { choices = [] } = req.body || {};

    const base = await Recipe.findById(recipeId);
    if (!base) return res.status(404).json({ error: 'Base recipe not found' });

    // Build substitution map and apply to ingredient text 
    const subsMap = {};
    choices.forEach(c => { if (c?.from && c?.to) subsMap[c.from.toLowerCase()] = c.to; });

    const newLines = parseLines(base.ingredients).map(line => {
      let out = line;
      Object.keys(subsMap).forEach(k => {
        const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
        out = out.replace(re, subsMap[k]);
      });
      return out;
    });

    
    const twist = await Recipe.create({
      name: `${base.name} — Twisted`,
      ingredients: newLines.join('\n'),
      instructions: base.instructions,
      culture: base.culture,
      image: base.image,
      category: base.category,
      spiceLevel: base.spiceLevel,
      dietType: base.dietType,

      isTwist: true,
      parentRecipe: base._id,
      substitutions: choices.map(c => ({ from: c.from, to: c.to })),

      

      tags: Array.from(new Set([...(base.tags || []), 'Twisted'])),
      status: 'pending',
      approved: false,
      submittedBy: userId,
    });

    // Track in user's myRecipes
    const user = await User.findById(userId);
    if (user) {
      user.myRecipes = user.myRecipes || [];
      user.myRecipes.push(twist._id);
      await user.save();
    }

    res.status(201).json({
      _id: twist._id,
      name: twist.name,
      status: twist.status,
      isTwist: true,
      message: 'Twisted recipe created. Awaiting dietician nutrition report.'
    });
  } catch (err) {
    const status = err.code || (err.name === 'JsonWebTokenError' ? 401 : 500);
    console.error('createTwist error:', err);
    res.status(status).json({ error: err.message || 'Failed to create twist' });
  }
};
