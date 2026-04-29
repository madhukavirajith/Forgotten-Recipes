// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

// Get available recipients
router.get('/available-recipients', chatController.getAvailableRecipients);

// Get recent conversations
router.get('/recent-conversations', chatController.getRecentConversations);

// Start a conversation
router.post('/start', chatController.startConversation);

// Get message history with pagination and search
router.get('/history/:conversationId', chatController.getMessages);

// Mark conversation as read
router.post('/:conversationId/read', chatController.markAsRead);

// Send a message
router.post('/:conversationId/messages', chatController.sendMessage);

// Edit a message
router.put('/messages/:messageId', chatController.editMessage);

// Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

// Add reaction to message
router.post('/messages/:messageId/reactions', chatController.addReaction);

// Remove reaction from message
router.delete('/messages/:messageId/reactions', chatController.removeReaction);

// Search messages in conversation
router.get('/:conversationId/search', chatController.searchMessages);

module.exports = router;