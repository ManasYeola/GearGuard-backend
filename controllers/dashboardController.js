const { MaintenanceRequest, Equipment, User, Team } = require('../models');
const { Op, fn, col } = require('sequelize');

// Admin Dashboard Statistics
exports.getAdminDashboard = async (req, res) => {
  try {
    // Total equipment
    const totalEquipment = await Equipment.count({ where: { isActive: true } });
    
    // Total users by role
    const usersByRole = await User.count({
      distinct: true,
      col: 'role',
      where: { isActive: true },
      group: ['role']
    });
    
    const users = await User.findAll({
      attributes: ['role', [fn('COUNT', col('id')), 'count']],
      where: { isActive: true },
      group: ['role']
    });
    
    const userStats = {
      total: await User.count({ where: { isActive: true } }),
      byRole: users.map(u => ({
        role: u.role,
        count: parseInt(u.dataValues.count)
      }))
    };
    
    // Maintenance requests statistics
    const requestByStage = await MaintenanceRequest.findAll({
      attributes: ['stage', [fn('COUNT', col('id')), 'count']],
      group: ['stage']
    });
    
    const requestStats = {
      total: await MaintenanceRequest.count(),
      byStage: requestByStage.map(r => ({
        stage: r.stage,
        count: parseInt(r.dataValues.count)
      }))
    };
    
    // Equipment by status
    const equipmentByStatus = await Equipment.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      where: { isActive: true },
      group: ['status']
    });
    
    const equipmentStats = {
      total: totalEquipment,
      byStatus: equipmentByStatus.map(e => ({
        status: e.status,
        count: parseInt(e.dataValues.count)
      }))
    };
    
    // Pending requests
    const pendingRequests = await MaintenanceRequest.count({
      where: { stage: 'New' }
    });
    
    // Overdue requests
    const overdueRequests = await MaintenanceRequest.count({
      where: {
        isOverdue: true,
        stage: { [Op.ne]: 'Repaired' }
      }
    });
    
    // Teams
    const totalTeams = await Team.count({ where: { isActive: true } });
    
    res.status(200).json({
      success: true,
      data: {
        equipment: equipmentStats,
        users: userStats,
        requests: requestStats,
        pendingRequests,
        overdueRequests,
        totalTeams
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard',
      error: error.message
    });
  }
};

// Technician Dashboard
exports.getTechnicianDashboard = async (req, res) => {
  try {
    // Get technician's assigned requests
    const myRequests = await MaintenanceRequest.findAll({
      where: { assignedToId: req.user.id }
    });
    
    const requestStats = {
      total: myRequests.length,
      pending: myRequests.filter(r => r.stage === 'New').length,
      inProgress: myRequests.filter(r => r.stage === 'In Progress').length,
      completed: myRequests.filter(r => r.stage === 'Repaired').length
    };
    
    // By priority
    const byPriority = {
      high: myRequests.filter(r => r.priority === 'High').length,
      medium: myRequests.filter(r => r.priority === 'Medium').length,
      low: myRequests.filter(r => r.priority === 'Low').length
    };
    
    // Average rating
    const ratingsData = await MaintenanceRequest.findAll({
      attributes: [[fn('AVG', col('rating')), 'avgRating']],
      where: {
        assignedToId: req.user.id,
        rating: { [Op.not]: null }
      }
    });
    
    const avgRating = ratingsData[0]?.dataValues?.avgRating || 0;
    
    // Upcoming scheduled tasks
    const upcoming = await MaintenanceRequest.findAll({
      where: {
        assignedToId: req.user.id,
        scheduledDate: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber']
        }
      ],
      order: [['scheduledDate', 'ASC']],
      limit: 5
    });
    
    res.status(200).json({
      success: true,
      data: {
        requests: requestStats,
        byPriority,
        avgRating: parseFloat(avgRating).toFixed(2),
        upcomingTasks: upcoming
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching technician dashboard',
      error: error.message
    });
  }
};

// Employee Dashboard
exports.getEmployeeDashboard = async (req, res) => {
  try {
    // Get employee's equipment
    const myEquipment = await Equipment.findAll({
      where: {
        assignedEmployeeEmail: req.user.email,
        isActive: true
      }
    });
    
    const equipmentStats = {
      total: myEquipment.length,
      active: myEquipment.filter(e => e.status === 'Active').length,
      maintenance: myEquipment.filter(e => e.status === 'Under Maintenance').length
    };
    
    // Get my requests
    const myRequests = await MaintenanceRequest.findAll({
      where: { createdById: req.user.id }
    });
    
    const requestStats = {
      total: myRequests.length,
      pending: myRequests.filter(r => r.stage === 'New').length,
      inProgress: myRequests.filter(r => r.stage === 'In Progress').length,
      completed: myRequests.filter(r => r.stage === 'Repaired').length
    };
    
    // Recent requests
    const recentRequests = await MaintenanceRequest.findAll({
      where: { createdById: req.user.id },
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      success: true,
      data: {
        equipment: equipmentStats,
        requests: requestStats,
        recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee dashboard',
      error: error.message
    });
  }
};

// Get team performance
exports.getTeamPerformance = async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true }
    });
    
    const performance = await Promise.all(
      teams.map(async (team) => {
        const completed = await MaintenanceRequest.count({
          where: {
            maintenanceTeamId: team.id,
            stage: 'Repaired'
          }
        });
        
        const inProgress = await MaintenanceRequest.count({
          where: {
            maintenanceTeamId: team.id,
            stage: 'In Progress'
          }
        });
        
        const avgRatingData = await MaintenanceRequest.findAll({
          attributes: [[fn('AVG', col('rating')), 'avgRating']],
          where: {
            maintenanceTeamId: team.id,
            rating: { [Op.not]: null }
          }
        });
        
        return {
          teamId: team.id,
          teamName: team.name,
          specialization: team.specialization,
          completed,
          inProgress,
          avgRating: parseFloat(avgRatingData[0]?.dataValues?.avgRating || 0).toFixed(2)
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team performance',
      error: error.message
    });
  }
};
