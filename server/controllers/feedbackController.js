const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });
    const { recipeId, type, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });
    const fb = await Feedback.create({
      user: req.user._id,
      recipe: recipeId || null,
      type: (type || 'other').toLowerCase(),
      message: message.trim(),
      status: 'open',
    });
    res.status(201).json(fb);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.listFeedback = async (_req, res) => {
  try {
    const items = await Feedback.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('recipe', 'name');
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['open', 'in-progress', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await Feedback.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('recipe', 'name');
    if (!updated) return res.status(404).json({ message: 'Feedback not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const del = await Feedback.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Feedback not found' });
    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};