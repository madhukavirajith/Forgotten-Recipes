const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createBlog,
  getBlogs,
  getAdminBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  bookmarkBlog,
  getBlogComments,
  addBlogComment,
  deleteBlogComment,
  editBlogComment
} = require('../controllers/blogController');

// Protected admin endpoints
router.get('/admin-list', protect, adminOnly, getAdminBlogs);

// Public endpoints
router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.get('/:id/comments', getBlogComments);

// Protected user endpoints
router.post('/:id/like', protect, likeBlog);
router.post('/:id/bookmark', protect, bookmarkBlog);
router.post('/:id/comments', protect, addBlogComment);
router.put('/:id/comments/:commentId', protect, editBlogComment);
router.delete('/:id/comments/:commentId', protect, deleteBlogComment);

// Protected admin CRUD endpoints
router.post('/', protect, adminOnly, createBlog);
router.put('/:id', protect, adminOnly, updateBlog);
router.delete('/:id', protect, adminOnly, deleteBlog);

module.exports = router;