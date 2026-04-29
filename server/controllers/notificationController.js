const Notification = require('../models/Notification');

const createNotification = async (userId, title, message, type = 'general') => {
  if (!userId || !message) {
    throw new Error('Notification must include userId and message');
  }

  const notification = await Notification.create({
    user: userId,
    title: title || 'Notification',
    message,
    type,
  });

  const payload = {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };

  if (global.io) {
    global.io.to(`user:${userId}`).emit('notification', payload);
  }

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

const sendTestNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!message) {
      return res.status(400).json({ msg: 'Notification message required' });
    }

    const notification = await createNotification(
      req.user.id,
      title || 'Test Notification',
      message,
      type || 'general'
    );

    res.status(201).json(notification);
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ msg: 'Unable to send notification' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllRead,
  sendTestNotification,
};
