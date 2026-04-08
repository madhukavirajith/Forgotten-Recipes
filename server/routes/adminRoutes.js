
const express = require('express');
const router = express.Router();
const {
  adminOnly,
  getAllUsers,
  deleteUser,
  getSiteStats,
  getFeedback,
  postBlog
} = require('../controllers/adminController');

// Apply admin-only middleware to all routes
router.use(adminOnly);

// Admin routes
router.get('/users', getAllUsers); // Get all visitors
router.delete('/users/:id', deleteUser); // Delete a visitor
router.get('/stats', getSiteStats); // Get site statistics
router.get('/feedback', getFeedback); // Placeholder
router.post('/blog', postBlog); // Placeholder

module.exports = router;
