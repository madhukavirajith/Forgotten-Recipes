
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notificationController');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register User (Visitors only)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, dob, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'visitor',
      phone,
      dob,
      address
    });

    if (user) {
      const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      };

      res.status(201).json(response);

      createNotification(user._id, 'Welcome to Forgotten Recipes', 'Your account has been created successfully.', 'general', '/visitor').catch((err) => {
        console.error('Failed to create welcome notification:', err);
      });
    } else {
      res.status(400).json({ msg: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ msg: 'Server error during registration' });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const { name, phone, dob, address, notificationPreferences } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.dob = dob || user.dob;
    user.address = address || user.address;

    // Update notification preferences if provided
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      dob: updatedUser.dob,
      address: updatedUser.address
    });

    createNotification(updatedUser._id, 'Profile Updated', 'Your profile changes were saved successfully.', 'general', '/profile').catch((err) => {
      console.error('Failed to create profile update notification:', err);
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current password and new password are required' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ msg: 'Password changed successfully' });

    createNotification(user._id, 'Password Changed', 'Your password has been changed successfully.', 'general', '/settings').catch((err) => {
      console.error('Failed to create password change notification:', err);
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete Account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent deletion of system users
    if (['admin', 'headchef', 'dietician'].includes(user.role)) {
      return res.status(403).json({ msg: 'System accounts cannot be deleted' });
    }

    // Delete user's comments
    await require('../models/Comment').deleteMany({ user: user._id });
    
    // Delete user's ratings
    await require('../models/Rating').deleteMany({ user: user._id });
    
    // Delete user's notifications
    await require('../models/Notification').deleteMany({ user: user._id });

    // Delete the user
    await user.deleteOne();

    res.json({ msg: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount
};


