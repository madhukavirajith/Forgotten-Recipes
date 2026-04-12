const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllUsers,
  deleteUser,
  getSiteStats,
  postBlog
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Statistics
router.get('/stats', getSiteStats);

// Blog posts
router.post('/blog', postBlog);

module.exports = router;