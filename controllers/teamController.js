const Team = require('../models/Team');

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('members', 'name email role avatar')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
};

// Get single team
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email role avatar');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team',
      error: error.message
    });
  }
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating team',
      error: error.message
    });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('members', 'name email role avatar');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating team',
      error: error.message
    });
  }
};

// Delete team (soft delete)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting team',
      error: error.message
    });
  }
};

// Add member to team
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User already in team'
      });
    }
    
    team.members.push(userId);
    await team.save();
    
    await team.populate('members', 'name email role avatar');
    
    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};

// Remove member from team
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    team.members = team.members.filter(member => member.toString() !== userId);
    await team.save();
    
    await team.populate('members', 'name email role avatar');
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};
