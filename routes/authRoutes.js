const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register - Register new user (public)
router.post('/register', authController.register);

// POST /api/auth/login - Login user (public)
router.post('/login', authController.login);

// GET /api/auth/me - Get current user (protected — requires valid JWT)
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
