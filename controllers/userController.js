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

// Create user
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    
    const userWithTeam = await User.findByPk(user.id, {
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
      message: 'User created successfully',
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
