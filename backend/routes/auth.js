const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;