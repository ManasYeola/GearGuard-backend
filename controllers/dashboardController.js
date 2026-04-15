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
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard',
      error: error.message
    });
  }
};

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
      include: [
        {
          model: Equipment,
          as: 'equipment',
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
    res.status(500).json({
      success: false,
      message: 'Error fetching technician dashboard',
      error: error.message
    });
  }
};

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
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

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
    res.status(500).json({
      success: false,
      message: 'Error fetching employee dashboard',
      error: error.message
    });
  }
};

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
    res.status(500).json({
      success: false,
      message: 'Error fetching team performance',
      error: error.message
    });
  }
};
