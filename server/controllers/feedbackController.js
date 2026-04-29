const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

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

    // Notify admins about new feedback
    try {
      const admins = await User.find({ role: 'admin' });
      const submitter = await User.findById(req.user._id).select('name');

      for (const admin of admins) {
        await createNotification(
          admin._id,
          'New Feedback Received',
          `${submitter?.name || 'A user'} submitted ${type || 'general'} feedback.`
        );
      }
    } catch (notifyErr) {
      console.error('Failed to notify admins:', notifyErr);
    }

    res.status(201).json(fb);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.listFeedback = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    const items = await Feedback.find(filter)
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

    const feedback = await Feedback.findById(id).populate('user', 'name');
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    const oldStatus = feedback.status;
    const updated = await Feedback.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('recipe', 'name');

    // Notify the feedback submitter about status change
    if (updated && oldStatus !== status && updated.user) {
      try {
        const statusMessages = {
          'in-progress': 'is now being reviewed',
          'closed': 'has been resolved'
        };

        if (statusMessages[status]) {
          await createNotification(
            updated.user._id,
            'Feedback Update',
            `Your feedback ${statusMessages[status]}.`
          );
        }
      } catch (notifyErr) {
        console.error('Failed to notify feedback submitter:', notifyErr);
      }
    }

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