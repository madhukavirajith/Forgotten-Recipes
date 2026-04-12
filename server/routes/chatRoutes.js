// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // ✅ import protect correctly
const chatController = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);  // ✅ now protect is a middleware function

router.get('/available-recipients', chatController.getAvailableRecipients);
router.get('/recent-conversations', chatController.getRecentConversations);
router.post('/start', chatController.startConversation);
router.get('/history/:conversationId', chatController.getMessages);
router.post('/:conversationId/read', chatController.markAsRead);

module.exports = router;