
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Start or fetch a conversation (one per visitor per role)
exports.startConversation = async (req, res) => {
  try {
    const { visitorId, targetRole } = req.body; 
    if (!visitorId || !targetRole) return res.status(400).json({ message: 'visitorId and targetRole required' });

    let convo = await Conversation.findOne({ visitor: visitorId, targetRole });
    if (!convo) convo = await Conversation.create({ visitor: visitorId, targetRole });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all messages in a conversation
exports.getHistory = async (req, res) => {
  try {
    const { id } = req.params; // conversationId
    const msgs = await Message.find({ conversation: id }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// For staff dashboards
exports.listConversationsByRole = async (req, res) => {
  try {
    const { role } = req.query; // 'dietician' or 'headchef'
    if (!role) return res.status(400).json({ message: 'role required' });
    const convos = await Conversation.find({ targetRole: role, status: 'open' })
      .sort({ updatedAt: -1 })
      .populate('visitor', 'name email');
    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
