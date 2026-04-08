
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

// Public routes
router.post('/register', registerUser); // For visitors
router.post('/login', loginUser);       // All roles

// Protected routes 
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

module.exports = router;

