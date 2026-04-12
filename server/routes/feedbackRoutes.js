const router = require('express').Router();
const {
  createFeedback,
  listFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');

// Visitor (logged-in) can create
router.post('/', protect, createFeedback);

// Admin management (all routes below require admin)
router.get('/', protect, adminOnly, listFeedback);
router.patch('/:id/status', protect, adminOnly, updateFeedbackStatus);
router.delete('/:id', protect, adminOnly, deleteFeedback);

module.exports = router;