const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createBlog, getBlogs, getBlogById, updateBlog, deleteBlog } = require('../controllers/blogController');

router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protected routes (Admin only)
router.post('/', protect, adminOnly, createBlog);
router.put('/:id', protect, adminOnly, updateBlog);
router.delete('/:id', protect, adminOnly, deleteBlog);

module.exports = router;