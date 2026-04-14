const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Team } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

/**
 * Generate a signed JWT for a given user record.
 * Payload includes only the fields that are safe and useful in every request.
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── Register new user ────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

<<<<<<< HEAD
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
=======
>>>>>>> a32c162 (Changes applied)
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user — role is ALWAYS 'User' for self-registration.
    // Staff accounts (Technician / Manager / Admin) must be created by an Admin
    // via POST /api/users.
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
<<<<<<< HEAD
      role: role || 'User',
      isActive: true
=======
      role: 'User'
>>>>>>> a32c162 (Changes applied)
    });

    // Fetch with team info (excluding password)
    const userWithTeam = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'specialization']
        }
      ]
    });

<<<<<<< HEAD
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithTeam,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      }
=======
    // Sign JWT
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: userWithTeam
>>>>>>> a32c162 (Changes applied)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// ── Login user ───────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'specialization']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
<<<<<<< HEAD
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    // Remove password from response
=======

    // Build safe user response (no password)
>>>>>>> a32c162 (Changes applied)
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Sign JWT
    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
<<<<<<< HEAD
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      }
=======
      token,
      data: userResponse
>>>>>>> a32c162 (Changes applied)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

<<<<<<< HEAD
// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Fetch user
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
=======
// ── Get current user (requires protect middleware) ───────────────────────────
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'specialization']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
>>>>>>> a32c162 (Changes applied)
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Fetch fresh user data with team info
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'specialization']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current user',
      error: error.message
    });
  }
};

// Logout (optional - for frontend to discard tokens)
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please discard tokens on client side.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

module.exports = exports;
