const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationRead,
  markAllRead,
  sendTestNotification,
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markNotificationRead);
router.post('/test', protect, sendTestNotification);

module.exports = router;
