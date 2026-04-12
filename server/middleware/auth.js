// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

// Main authentication middleware
exports.protect = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Not authorized: missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name role email');
    if (!user) return res.status(401).json({ message: 'Not authorized: user not found' });

    // Attach consistent user object
    req.user = {
      id: user._id,
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin only' });
};

// Role-based middleware
exports.allowRoles = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Forbidden' });
};