
const express = require('express');
const router = express.Router();
const { startConversation, getHistory, listConversationsByRole } = require('../controllers/chatController');

router.post('/start', startConversation);           // { visitorId, targetRole }
router.get('/history/:id', getHistory);             // id = conversationId
router.get('/conversations', listConversationsByRole); // ?role=dietician|headchef

module.exports = router;
