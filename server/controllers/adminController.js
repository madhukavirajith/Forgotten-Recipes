// server/controllers/adminController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Blog = require('../models/Blog');

// Admin-only middleware function (inline)
const adminOnly = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'visitor' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({ msg: 'Server error while fetching users' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: `${user.name} deleted successfully.` });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ msg: 'Server error while deleting user' });
  }
};

const getSiteStats = async (req, res) => {
  try {
    const totalVisitors = await User.countDocuments({ role: 'visitor' });
    const totalUsers = await User.countDocuments();

    res.json({
      totalUsers: totalUsers,
      totalVisitors: totalVisitors,
      systemRoles: {
        admin: 1,
        headchef: 1,
        dietician: 1
      }
    });
  } catch (err) {
    console.error('Site Stats Error:', err);
    res.status(500).json({ msg: 'Server error while fetching site stats' });
  }
};


const getFeedback = async (req, res) => {
  try {
    res.json({ 
      msg: 'Feedback feature coming soon',
      feedbacks: []
    });
  } catch (err) {
    console.error('Feedback Error:', err);
    res.status(500).json({ msg: 'Server error while fetching feedback' });
  }
};

const postBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content required' });
    }

    const blog = new Blog({
      title,
      content,
      author: req.user._id
    });
    await blog.save();

    res.status(201).json({
      msg: 'Blog posted successfully',
      blog: {
        _id: blog._id,
        title: blog.title,
        content: blog.content,
        author: req.user.name,
        timestamp: blog.timestamp
      }
    });
  } catch (err) {
    console.error('Post Blog Error:', err);
    res.status(500).json({ msg: 'Server error while posting blog' });
  }
};

module.exports = {
  adminOnly, // Export the middleware for use in routes
  getAllUsers,
  deleteUser,
  getSiteStats,
  getFeedback,
  postBlog
};


