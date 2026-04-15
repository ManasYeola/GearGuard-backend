const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/jwt');

// POST /api/auth/register - Register new user (public)
router.post('/register', authController.register);

// POST /api/auth/login - Login user (public)
router.post('/login', authController.login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticateToken, authController.getCurrentUser);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
