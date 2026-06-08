const Notification = require('../models/Notification');

const createNotification = async (userId, title, message, type = 'general', actionUrl = '', metadata = null) => {
  if (!userId || !message) {
    throw new Error('Notification must include userId and message');
  }

  const notification = await Notification.create({
    user: userId,
    title: title || 'Notification',
    message,
    type,
    actionUrl,
    metadata,
  });

  const payload = {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };

  if (global.io) {
    global.io.to(`user:${userId}`).emit('notification', payload);
  }

  // Handle background email delivery
  const User = require('../models/User');
  User.findById(userId).then(user => {
    if (user && user.notificationPreferences?.emailNotifications !== false) {
      const emailService = require('../services/emailService');
      const textToScan = message || '';
      
      // Match double quotes, fall back to matching single quotes
      let recipeName = 'Your recipe';
      const quoteMatch = textToScan.match(/"([^"]+)"/) || textToScan.match(/'([^']+)'/);
      if (quoteMatch) {
        recipeName = quoteMatch[1];
      }

      if (title === 'Welcome to Forgotten Recipes') {
        emailService.sendWelcomeEmail(user.email, user.name).catch(console.error);
      } else if (title === 'Recipe Approved') {
        emailService.sendRecipeStatusEmail(user.email, user.name, recipeName, true).catch(console.error);
      } else if (title === 'Recipe Rejected') {
        emailService.sendRecipeStatusEmail(user.email, user.name, recipeName, false).catch(console.error);
      } else if (title === 'Nutrition Information Added') {
        emailService.sendNutritionAddedEmail(user.email, user.name, recipeName).catch(console.error);
      } else if (title === 'Feedback Update') {
        const isClosed = textToScan.toLowerCase().includes('resolved') || textToScan.toLowerCase().includes('closed');
        emailService.sendFeedbackUpdateEmail(user.email, user.name, textToScan, isClosed ? 'closed' : 'in-progress').catch(console.error);
      }
    }
  }).catch(err => {
    console.error('Error fetching user for notification email:', err);
  });

  return payload;
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ msg: 'Unable to load notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json({ msg: 'Notification marked read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ msg: 'Unable to update notification' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ msg: 'All notifications marked read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ msg: 'Unable to update notifications' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllRead,
};
