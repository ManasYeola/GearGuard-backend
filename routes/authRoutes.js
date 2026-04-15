const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
<<<<<<< HEAD
const { protect } = require('../middleware/auth');
=======
const { authenticateToken } = require('../middleware/jwt');
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545

// POST /api/auth/register - Register new user (public)
router.post('/register', authController.register);

// POST /api/auth/login - Login user (public)
router.post('/login', authController.login);

<<<<<<< HEAD
// GET /api/auth/me - Get current user (protected — requires valid JWT)
router.get('/me', protect, authController.getCurrentUser);
=======
// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticateToken, authController.getCurrentUser);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, authController.logout);
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545

module.exports = router;
