
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const PDFDocument = require('pdfkit');
const Comment = require('../models/Comment');
const Rating  = require('../models/Rating');


exports.getRecipes = async (_req, res) => {
  try {
    const recipes = await Recipe.find({
      $or: [{ status: 'approved' }, { approved: true }],
    }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRecipes = async (_req, res) => {
  try {
    const recipes = await Recipe.find({}).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.status) payload.status = 'approved';
    payload.approved = payload.status === 'approved';
    const recipe = new Recipe(payload);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.status) payload.approved = payload.status === 'approved';
    const updated = await Recipe.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Recipe not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ------------------------- Public: detail (auth for PDFs) ------------------- */
exports.getRecipeWithNutrition = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (!(recipe.status === 'approved' || recipe.approved === true)) {
      return res.status(403).json({ message: 'Recipe not published' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recipes/:id/recipe-pdf  (auth via route)
// Creates a full recipe PDF
exports.downloadRecipePdf = async (req, res) => {
  try {
    const r = await Recipe.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Recipe not found' });
    if (!(r.status === 'approved' || r.approved === true)) {
      return res.status(403).json({ message: 'Recipe not published' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const safeName = (r.name || 'recipe').replace(/[^\w\- ]/g, '').slice(0, 60);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Header
    doc.fontSize(22).text(r.name || 'Untitled Recipe', { underline: true });
    if (r.isTwist) {
      doc.moveDown(0.2).fontSize(11).fillColor('#666').text('Twisted version of a traditional recipe');
      doc.fillColor('black');
    }
    doc.moveDown(0.5);

    // Try to include image if base64
    if (r.image && typeof r.image === 'string' && r.image.startsWith('data:image')) {
      try {
        const comma = r.image.indexOf(',');
        const b64 = r.image.slice(comma + 1);
        const buf = Buffer.from(b64, 'base64');
        doc.image(buf, { fit: [220, 220], align: 'right' });
      } catch (e) { /* ignore */ }
    }

    // Meta
    const meta = [
      r.category ? `Category: ${r.category}` : null,
      r.spiceLevel ? `Spice: ${r.spiceLevel}` : null,
      r.dietType ? `Diet: ${r.dietType}` : null,
      r.culture ? `Culture: ${r.culture}` : null,
    ].filter(Boolean).join('   •   ');
    if (meta) doc.fontSize(12).text(meta);
    doc.moveDown(0.6);

    // Ingredients
    doc.fontSize(14).text('Ingredients', { underline: true });
    doc.fontSize(12).moveDown(0.2).text(r.ingredients || '-', { lineGap: 2 });
    doc.moveDown(0.8);

    // Instructions
    doc.fontSize(14).text('Instructions', { underline: true });
    doc.fontSize(12).moveDown(0.2).text(r.instructions || '-', { lineGap: 2 });
    doc.moveDown(0.8);

    // Nutrition
    const n = r.nutrition || {};
    doc.fontSize(14).text('Nutrition', { underline: true });
    doc.fontSize(12);
    doc.text(`Calories: ${n.calories ?? 0}`);
    doc.text(`Protein: ${n.protein ?? 0} g`);
    doc.text(`Carbs:   ${n.carbs ?? 0} g`);
    doc.text(`Fat:     ${n.fat ?? 0} g`);
    if (n.ratingFlag) doc.text(`Health Label: ${n.ratingFlag}`);
    if (Array.isArray(n.vitamins) && n.vitamins.length) {
      doc.moveDown(0.3).text('Vitamins & Minerals:');
      n.vitamins.forEach(v => doc.text(`• ${v.name || ''}: ${v.amount || ''}`));
    }
    if (Array.isArray(n.benefits) && n.benefits.length) {
      doc.moveDown(0.3).text('Ingredient Benefits:');
      n.benefits.forEach(b => doc.text(`• ${b}`));
    }
    doc.moveDown(0.6);

    // Tags
    if (Array.isArray(r.tags) && r.tags.length) {
      doc.fontSize(12).text(`Tags: ${r.tags.join(', ')}`);
    }

    doc.moveDown(0.6);
    doc.fontSize(10).fillColor('#666')
      .text(`Generated by Forgotten Recipes • ${new Date().toLocaleString()}`);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recipes/:id/nutrition-report  (auth via route)
exports.downloadNutritionReport = async (req, res) => {
  try {
    const r = await Recipe.findById(req.params.id).select('name nutrition tags status approved');
    if (!r) return res.status(404).json({ message: 'Recipe not found' });
    if (!(r.status === 'approved' || r.approved === true)) {
      return res.status(403).json({ message: 'Recipe not published' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="nutrition-${r._id}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text(`Nutrition Report: ${r.name}`, { underline: true });
    doc.moveDown();

    const n = r.nutrition || {};
    doc.fontSize(12).text(`Calories per portion: ${n.calories ?? 0}`);
    doc.text(`Protein: ${n.protein ?? 0} g`);
    doc.text(`Carbs: ${n.carbs ?? 0} g`);
    doc.text(`Fat: ${n.fat ?? 0} g`);

    if (Array.isArray(n.vitamins) && n.vitamins.length) {
      doc.moveDown().text('Vitamins & Minerals:');
      n.vitamins.forEach(v => doc.text(`• ${v.name || ''}: ${v.amount || ''}`));
    }
    if (Array.isArray(n.benefits) && n.benefits.length) {
      doc.moveDown().text('Ingredient Benefits:');
      n.benefits.forEach(b => doc.text(`• ${b}`));
    }

    doc.moveDown().text(`Health Label: ${n.ratingFlag || 'neutral'}`);
    if (Array.isArray(r.tags) && r.tags.length) {
      doc.moveDown().text(`Tags: ${r.tags.join(', ')}`);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ------------------------------ Comments (auth) ----------------------------- */
exports.getComments = async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const comments = await Comment.find({ recipe: recipeId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });

    const { id: recipeId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' });

    const comment = await Comment.create({
      recipe: recipeId,
      user: req.user._id,
      text: text.trim(),
    });

    await Recipe.findByIdAndUpdate(recipeId, { $inc: { commentsCount: 1 } });
    const populated = await comment.populate('user', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });

    const { id: recipeId, commentId } = req.params;
    const c = await Comment.findById(commentId);
    if (!c) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = c.user?.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    await c.deleteOne();
    await Recipe.findByIdAndUpdate(recipeId, { $inc: { commentsCount: -1 } });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------- Ratings (auth) --------------------------- */
exports.rateRecipe = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });

    const { id: recipeId } = req.params;
    const { value } = req.body;
    if (!(value >= 1 && value <= 5)) {
      return res.status(400).json({ message: 'Rating must be 1–5' });
    }

    await Rating.findOneAndUpdate(
      { recipe: recipeId, user: req.user._id },
      { $set: { value } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const agg = await Rating.aggregate([
      { $match: { recipe: new mongoose.Types.ObjectId(recipeId) } },
      { $group: { _id: '$recipe', avg: { $avg: '$value' }, count: { $sum: 1 } } }
    ]);
    const { avg = 0, count = 0 } = agg[0] || {};
    const averageRating = Number((avg || 0).toFixed(2));

    await Recipe.findByIdAndUpdate(recipeId, {
      $set: { averageRating, ratingsCount: count }
    });

    res.json({ averageRating, ratingsCount: count, myRating: value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyRating = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });
    const r = await Rating.findOne({ recipe: req.params.id, user: req.user._id });
    res.json({ value: r?.value || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
