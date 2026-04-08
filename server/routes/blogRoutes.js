const express = require('express');
const router = express.Router();
const { createBlog, getBlogs } = require('../controllers/blogController');

// Route to create a blog post 
router.post('/', createBlog);

// Route to fetch all blog posts
router.get('/', getBlogs);

module.exports = router;
