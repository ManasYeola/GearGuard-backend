const bcrypt = require('bcryptjs');
const { User, Team } = require('../models');

// Register new user
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
    
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'User'
    });
    
    // Get user with team info (excluding password)
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
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userWithTeam
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

// Login user
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
    
    // Find user by email
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
    
    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: userResponse
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

// Get current user (if you implement sessions/JWT later)
exports.getCurrentUser = async (req, res) => {
  try {
    // This would use the user ID from session/JWT
    // For now, just a placeholder
    res.status(200).json({
      success: true,
      message: 'Get current user endpoint'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching current user',
      error: error.message
    });
  }
};

module.exports = exports;
