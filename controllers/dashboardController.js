<<<<<<< HEAD
const { Equipment, MaintenanceRequest, Team, User } = require('../models');
const { Op } = require('sequelize');

// ── Helper ────────────────────────────────────────────────────────────────────
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── GET /api/dashboard/admin ──────────────────────────────────────────────────
// Full system overview — for Admin & Manager roles
exports.getAdminDashboard = async (req, res) => {
  try {
    const todayStart = startOfToday();

    const [
      totalEquipment,
      activeEquipment,
      underMaintenanceEquipment,
      totalRequests,
      newRequests,
      inProgressRequests,
      repairedRequests,
      completedToday,
      overdueRequests,
      totalTeams,
      totalUsers
    ] = await Promise.all([
      Equipment.count({ where: { isActive: true } }),
      Equipment.count({ where: { isActive: true, status: 'Active' } }),
      Equipment.count({ where: { isActive: true, status: 'Under Maintenance' } }),
      MaintenanceRequest.count(),
      MaintenanceRequest.count({ where: { stage: 'New' } }),
      MaintenanceRequest.count({ where: { stage: 'In Progress' } }),
      MaintenanceRequest.count({ where: { stage: 'Repaired' } }),
      MaintenanceRequest.count({
        where: {
          stage: 'Repaired',
          completedDate: { [Op.gte]: todayStart }
        }
      }),
      MaintenanceRequest.count({ where: { isOverdue: true } }),
      Team.count({ where: { isActive: true } }),
      User.count({ where: { isActive: true } })
    ]);

    // Average response time in hours for completed requests
    const completedWithTimes = await MaintenanceRequest.findAll({
      where: {
        stage: 'Repaired',
        completedDate: { [Op.ne]: null }
      },
      attributes: ['createdAt', 'completedDate']
    });

    let avgResponseTime = null;
    if (completedWithTimes.length > 0) {
      const totalHours = completedWithTimes.reduce((sum, r) => {
        const diff = new Date(r.completedDate) - new Date(r.createdAt);
        return sum + diff / (1000 * 60 * 60);
      }, 0);
      avgResponseTime = parseFloat((totalHours / completedWithTimes.length).toFixed(1));
    }

    res.status(200).json({
      success: true,
      data: {
        equipment: {
          total: totalEquipment,
          active: activeEquipment,
          underMaintenance: underMaintenanceEquipment
        },
        requests: {
          total: totalRequests,
          new: newRequests,
          inProgress: inProgressRequests,
          repaired: repairedRequests,
          completedToday,
          overdue: overdueRequests,
          open: newRequests + inProgressRequests
        },
        avgResponseTimeHours: avgResponseTime,
        teams: totalTeams,
        users: totalUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
=======
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
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard',
      error: error.message
    });
  }
};

<<<<<<< HEAD
// ── GET /api/dashboard/technician ─────────────────────────────────────────────
// Tasks assigned to the logged-in technician
exports.getTechnicianDashboard = async (req, res) => {
  try {
    const techId = req.user.id;
    const todayStart = startOfToday();

    const [assigned, inProgress, completedToday, overdue] = await Promise.all([
      MaintenanceRequest.count({ where: { assignedToId: techId, stage: 'New' } }),
      MaintenanceRequest.count({ where: { assignedToId: techId, stage: 'In Progress' } }),
      MaintenanceRequest.count({
        where: {
          assignedToId: techId,
          stage: 'Repaired',
          completedDate: { [Op.gte]: todayStart }
        }
      }),
      MaintenanceRequest.count({
        where: { assignedToId: techId, isOverdue: true }
      })
    ]);

    // Recent assigned requests
    const recentTasks = await MaintenanceRequest.findAll({
      where: { assignedToId: techId },
=======
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
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
      include: [
        {
          model: Equipment,
          as: 'equipment',
<<<<<<< HEAD
          attributes: ['id', 'name', 'serialNumber', 'location']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        assigned,
        inProgress,
        completedToday,
        overdue,
        recentTasks
      }
    });
  } catch (error) {
    console.error('Technician dashboard error:', error);
=======
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
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
    res.status(500).json({
      success: false,
      message: 'Error fetching technician dashboard',
      error: error.message
    });
  }
};

<<<<<<< HEAD
// ── GET /api/dashboard/employee ───────────────────────────────────────────────
// Requests raised by the logged-in user
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, open, inProgress, completed] = await Promise.all([
      MaintenanceRequest.count({ where: { createdById: userId } }),
      MaintenanceRequest.count({ where: { createdById: userId, stage: 'New' } }),
      MaintenanceRequest.count({ where: { createdById: userId, stage: 'In Progress' } }),
      MaintenanceRequest.count({ where: { createdById: userId, stage: 'Repaired' } })
    ]);

    const myRequests = await MaintenanceRequest.findAll({
      where: { createdById: userId },
=======
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
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber']
<<<<<<< HEAD
=======
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
<<<<<<< HEAD

    res.status(200).json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        completed,
        myRequests
      }
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
=======
    
    res.status(200).json({
      success: true,
      data: {
        equipment: equipmentStats,
        requests: requestStats,
        recentRequests
      }
    });
  } catch (error) {
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
    res.status(500).json({
      success: false,
      message: 'Error fetching employee dashboard',
      error: error.message
    });
  }
};

<<<<<<< HEAD
// ── GET /api/dashboard/team-performance ───────────────────────────────────────
// Team-level stats for managers
exports.getTeamPerformance = async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'role'],
          where: { isActive: true },
          required: false
        }
      ]
    });

    // For each team, count requests
    const teamStats = await Promise.all(
      teams.map(async (team) => {
        const [total, open, completed] = await Promise.all([
          MaintenanceRequest.count({ where: { maintenanceTeamId: team.id } }),
          MaintenanceRequest.count({
            where: {
              maintenanceTeamId: team.id,
              stage: { [Op.in]: ['New', 'In Progress'] }
            }
          }),
          MaintenanceRequest.count({
            where: { maintenanceTeamId: team.id, stage: 'Repaired' }
          })
        ]);

        return {
          id: team.id,
          name: team.name,
          specialization: team.specialization,
          memberCount: team.members ? team.members.length : 0,
          requests: { total, open, completed }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: teamStats
    });
  } catch (error) {
    console.error('Team performance error:', error);
=======
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
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545
    res.status(500).json({
      success: false,
      message: 'Error fetching team performance',
      error: error.message
    });
  }
};
