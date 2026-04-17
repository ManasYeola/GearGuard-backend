const bcrypt = require('bcryptjs');
const { User, Team } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const attachTeam = {
  model: Team,
  as: 'team',
  attributes: ['id', 'name', 'specialization']
};

const buildTokens = (user) => {
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRE || '7d'
  };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
=======
    if (!EMAIL_REGEX.test(email)) {
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
<<<<<<< HEAD
    
    // Check if user already exists
=======

>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
<<<<<<< HEAD
      role: role || 'User',
=======
      role: 'User',
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
      isActive: true
    });

    const userWithTeam = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [attachTeam]
    });

<<<<<<< HEAD
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    res.status(201).json({
=======
    const tokens = buildTokens(user);

    return res.status(201).json({
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
      success: true,
      message: 'User registered successfully',
      token: tokens.accessToken,
      data: {
        user: userWithTeam,
        tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [attachTeam]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

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

>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
    const userResponse = user.toJSON();
    delete userResponse.password;

    const tokens = buildTokens(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
<<<<<<< HEAD
=======
      token: tokens.accessToken,
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
      data: {
        user: userResponse,
        tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

<<<<<<< HEAD
// Refresh token
=======
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [attachTeam]
    });

    return res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching current user',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logout successful. Please discard tokens on client side.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};