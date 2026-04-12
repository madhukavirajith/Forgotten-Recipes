const User = require('../models/User');
const Blog = require('../models/Blog');

// Get all visitors (users with role 'visitor')
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'visitor' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({ msg: 'Server error while fetching users' });
  }
};

// Delete a user by ID
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

// Get site statistics (total users, visitors, role counts)
const getSiteStats = async (req, res) => {
  try {
    const totalVisitors = await User.countDocuments({ role: 'visitor' });
    const totalUsers = await User.countDocuments();
    // For simplicity, we return static role counts; you can replace with dynamic aggregation if needed
    const systemRoles = {
      admin: await User.countDocuments({ role: 'admin' }),
      headchef: await User.countDocuments({ role: 'headchef' }),
      dietician: await User.countDocuments({ role: 'dietician' })
    };
    res.json({
      totalUsers,
      totalVisitors,
      systemRoles
    });
  } catch (err) {
    console.error('Site Stats Error:', err);
    res.status(500).json({ msg: 'Server error while fetching site stats' });
  }
};

// Post a new blog (admin only)
const postBlog = async (req, res) => {
  try {
    const { title, content, image } = req.body;
    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content are required' });
    }
    const blog = new Blog({
      title,
      content,
      image: image || '',
      author: req.user._id
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error('Post Blog Error:', err);
    res.status(500).json({ msg: 'Server error while posting blog' });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getSiteStats,
  postBlog
};