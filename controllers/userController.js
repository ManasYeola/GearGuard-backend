const bcrypt = require('bcryptjs');
const { User, Team } = require('../models');
const { Op } = require('sequelize');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, team } = req.query;
    
    let where = { isActive: true };
    
    if (role) where.role = role;
    if (team) where.teamId = team;
    
    const users = await User.findAll({
      where,
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'specialization']
        }
      ],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
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
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create staff account (Admin only — for Technician / Manager / Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, teamId } = req.body;

    // Only staff roles may be created through this endpoint
    const allowedRoles = ['Technician', 'Manager', 'Admin'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(', ')}. Regular users must self-register.`
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check for duplicate email
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      teamId: teamId || null
    });

    const userWithTeam = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Team, as: 'team', attributes: ['id', 'name', 'specialization'] }]
    });

    res.status(201).json({
      success: true,
      message: `${role} account created. They can now log in with their email and password.`,
      data: userWithTeam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update(req.body);
    
    const updatedUser = await User.findByPk(user.id, {
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
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ isActive: false });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};
