
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount
} = require('../controllers/userController');

// Public routes
router.post('/register', registerUser); // For visitors
router.post('/login', loginUser);       // All roles

// Protected routes 
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;

