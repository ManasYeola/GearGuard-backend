const { Equipment, MaintenanceRequest, Team, User } = require('../models');
const { Op, fn, col } = require('sequelize');
const PDFDocument = require('pdfkit');

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeMonthYear = (monthValue, yearValue) => {
  const now = new Date();
  const month = Number(monthValue || now.getMonth() + 1);
  const year = Number(yearValue || now.getFullYear());

  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;

  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return { month, year, startDate, endDate, label: `${year}-${String(month).padStart(2, '0')}` };
};

const baseRequestInclude = [
  { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serialNumber', 'location'] },
  { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
];

const buildAdminSummary = async () => {
  const [totalEquipment, activeEquipment, underMaintenanceEquipment, totalRequests, newRequests, inProgressRequests, repairedRequests, completedToday, overdueRequests, totalTeams, totalUsers] = await Promise.all([
    Equipment.count({ where: { isActive: true } }),
    Equipment.count({ where: { isActive: true, status: 'Active' } }),
    Equipment.count({ where: { isActive: true, status: 'Under Maintenance' } }),
    MaintenanceRequest.count(),
    MaintenanceRequest.count({ where: { stage: 'New' } }),
    MaintenanceRequest.count({ where: { stage: 'In Progress' } }),
    MaintenanceRequest.count({ where: { stage: 'Repaired' } }),
    MaintenanceRequest.count({ where: { stage: 'Repaired', completedDate: { [Op.gte]: startOfToday() } } }),
    MaintenanceRequest.count({ where: { isOverdue: true } }),
    Team.count({ where: { isActive: true } }),
    User.count({ where: { isActive: true } })
  ]);

  const completedWithTimes = await MaintenanceRequest.findAll({
    where: { stage: 'Repaired', completedDate: { [Op.ne]: null } },
    attributes: ['createdAt', 'completedDate']
  });

  let avgResponseTimeHours = null;
  if (completedWithTimes.length > 0) {
    const totalHours = completedWithTimes.reduce((sum, request) => {
      const diff = new Date(request.completedDate) - new Date(request.createdAt);
      return sum + diff / 36e5;
    }, 0);
    avgResponseTimeHours = Number((totalHours / completedWithTimes.length).toFixed(1));
  }

  return {
    equipment: { total: totalEquipment, active: activeEquipment, underMaintenance: underMaintenanceEquipment },
    requests: {
      total: totalRequests,
      new: newRequests,
      inProgress: inProgressRequests,
      repaired: repairedRequests,
      completedToday,
      overdue: overdueRequests,
      open: newRequests + inProgressRequests
    },
    avgResponseTimeHours,
    teams: totalTeams,
    users: totalUsers
  };
};

exports.getAdminDashboard = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: await buildAdminSummary() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching admin dashboard', error: error.message });
  }
};

exports.getTechnicianDashboard = async (req, res) => {
  try {
    const techId = req.user.id;
    const [assigned, inProgress, completedToday, overdue, recentTasks] = await Promise.all([
      MaintenanceRequest.count({ where: { assignedToId: techId, stage: 'New' } }),
      MaintenanceRequest.count({ where: { assignedToId: techId, stage: 'In Progress' } }),
      MaintenanceRequest.count({ where: { assignedToId: techId, stage: 'Repaired', completedDate: { [Op.gte]: startOfToday() } } }),
      MaintenanceRequest.count({ where: { assignedToId: techId, isOverdue: true } }),
      MaintenanceRequest.findAll({ where: { assignedToId: techId }, include: baseRequestInclude, order: [['createdAt', 'DESC']], limit: 5 })
    ]);

    return res.status(200).json({ success: true, data: { assigned, inProgress, completedToday, overdue, recentTasks } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching technician dashboard', error: error.message });
  }
};

exports.getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [total, open, inProgress, completed, myRequests] = await Promise.all([
      MaintenanceRequest.count({ where: { createdById: userId } }),
      MaintenanceRequest.count({ where: { createdById: userId, stage: 'New' } }),
      MaintenanceRequest.count({ where: { createdById: userId, stage: 'In Progress' } }),
      MaintenanceRequest.count({ where: { createdById: userId, stage: 'Repaired' } }),
      MaintenanceRequest.findAll({ where: { createdById: userId }, include: baseRequestInclude, order: [['createdAt', 'DESC']], limit: 5 })
    ]);

    return res.status(200).json({ success: true, data: { total, open, inProgress, completed, myRequests } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching employee dashboard', error: error.message });
  }
};

exports.getTeamPerformance = async (req, res) => {
  try {
    const teams = await Team.findAll({ where: { isActive: true } });
    const data = await Promise.all(
      teams.map(async (team) => {
        const [total, open, completed, memberCount] = await Promise.all([
          MaintenanceRequest.count({ where: { maintenanceTeamId: team.id } }),
          MaintenanceRequest.count({ where: { maintenanceTeamId: team.id, stage: { [Op.in]: ['New', 'In Progress'] } } }),
          MaintenanceRequest.count({ where: { maintenanceTeamId: team.id, stage: 'Repaired' } }),
          User.count({ where: { teamId: team.id, isActive: true } })
        ]);

        return { id: team.id, name: team.name, specialization: team.specialization, memberCount, requests: { total, open, completed } };
      })
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching team performance', error: error.message });
  }
};

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const normalizeRole = (role) => {
  if (!role) return 'User';
  return String(role);
};

const toIdList = (rows) => rows.map((item) => item.id);

const getUserIdsByRole = async ({ role, teamId = null }) => {
  const where = { role, isActive: true };
  if (teamId) {
    where.teamId = teamId;
  }

  const users = await User.findAll({ where, attributes: ['id'], raw: true });
  return toIdList(users);
};

const buildPeriodWhere = (period, dateField) => {
  if (!period) return {};
  return {
    [dateField]: {
      [Op.between]: [period.startDate, period.endDate]
    }
  };
};

const buildRoleBasedPayload = async (user, period = null) => {
  if (!user?.role) return { error: { status: 401, message: 'Authentication required' } };

  const createdDuringPeriod = buildPeriodWhere(period, 'createdAt');
  const completedDuringPeriod = buildPeriodWhere(period, 'completedDate');

  const payload = {
    role: normalizeRole(user.role),
    generatedAt: new Date().toISOString(),
    period: period ? { month: period.month, year: period.year, label: period.label } : null,
    scope: 'personal',
    personal: null,
    team: null,
    global: null
  };

  if (user.role === 'Admin') {
    payload.scope = 'global';

    const [userIds, technicianIds, teams] = await Promise.all([
      getUserIdsByRole({ role: 'User' }),
      getUserIdsByRole({ role: 'Technician' }),
      Team.findAll({ where: { isActive: true }, attributes: ['id', 'name'], raw: true })
    ]);

    const [repairedEquipments, requestsRaisedByUsers, solvedByTechnicians] = await Promise.all([
      MaintenanceRequest.count({
        where: {
          stage: 'Repaired',
          ...completedDuringPeriod
        },
        distinct: true,
        col: 'equipmentId'
      }),
      userIds.length
        ? MaintenanceRequest.count({ where: { createdById: { [Op.in]: userIds }, ...createdDuringPeriod } })
        : 0,
      technicianIds.length
        ? MaintenanceRequest.count({ where: { assignedToId: { [Op.in]: technicianIds }, stage: 'Repaired', ...completedDuringPeriod } })
        : 0
    ]);

    const byTeam = await Promise.all(
      teams.map(async (team) => {
        const [teamUserIds, teamTechnicianIds] = await Promise.all([
          getUserIdsByRole({ role: 'User', teamId: team.id }),
          getUserIdsByRole({ role: 'Technician', teamId: team.id })
        ]);

        const [teamRepairedEquipments, teamRequestsRaisedByUsers, teamSolvedByTechnicians] = await Promise.all([
          MaintenanceRequest.count({
            where: {
              maintenanceTeamId: team.id,
              stage: 'Repaired',
              ...completedDuringPeriod
            },
            distinct: true,
            col: 'equipmentId'
          }),
          teamUserIds.length
            ? MaintenanceRequest.count({ where: { createdById: { [Op.in]: teamUserIds }, ...createdDuringPeriod } })
            : 0,
          teamTechnicianIds.length
            ? MaintenanceRequest.count({ where: { assignedToId: { [Op.in]: teamTechnicianIds }, stage: 'Repaired', ...completedDuringPeriod } })
            : 0
        ]);

        return {
          teamId: team.id,
          teamName: team.name,
          repairedEquipments: teamRepairedEquipments,
          requestsRaisedByUsers: teamRequestsRaisedByUsers,
          solvedByTechnicians: teamSolvedByTechnicians,
          repairedRequests: teamSolvedByTechnicians
        };
      })
    );

    payload.global = {
      summary: {
        repairedEquipments,
        requestsRaisedByUsers,
        solvedByTechnicians
      },
      byTeam
    };
  } else if (user.role === 'Manager') {
    payload.scope = 'team';

    const team = user.teamId
      ? await Team.findOne({ where: { id: user.teamId, isActive: true }, attributes: ['id', 'name'], raw: true })
      : null;

    if (team) {
      const [teamUserIds, teamTechnicianIds, technicians] = await Promise.all([
        getUserIdsByRole({ role: 'User', teamId: team.id }),
        getUserIdsByRole({ role: 'Technician', teamId: team.id }),
        User.findAll({
          where: { teamId: team.id, role: 'Technician', isActive: true },
          attributes: ['id', 'name'],
          raw: true
        })
      ]);

      const [repairedEquipments, requestsRaisedByUsers, solvedByTechnicians] = await Promise.all([
        MaintenanceRequest.count({
          where: {
            maintenanceTeamId: team.id,
            stage: 'Repaired',
            ...completedDuringPeriod
          },
          distinct: true,
          col: 'equipmentId'
        }),
        teamUserIds.length
          ? MaintenanceRequest.count({ where: { createdById: { [Op.in]: teamUserIds }, ...createdDuringPeriod } })
          : 0,
        teamTechnicianIds.length
          ? MaintenanceRequest.count({ where: { assignedToId: { [Op.in]: teamTechnicianIds }, stage: 'Repaired', ...completedDuringPeriod } })
          : 0
      ]);

      const byTechnician = await Promise.all(
        technicians.map(async (technician) => ({
          technicianId: technician.id,
          name: technician.name,
          solvedCount: await MaintenanceRequest.count({
            where: {
              assignedToId: technician.id,
              stage: 'Repaired',
              ...completedDuringPeriod
            }
          })
        }))
      );

      payload.team = {
        team,
        summary: {
          repairedEquipments,
          requestsRaisedByUsers,
          solvedByTechnicians
        },
        byTechnician
      };
    } else {
      payload.team = {
        team: null,
        summary: {
          repairedEquipments: 0,
          requestsRaisedByUsers: 0,
          solvedByTechnicians: 0
        },
        byTechnician: []
      };
    }
  }

  if (user.role === 'Technician') {
    const [solved, verifiedClosed, avgRatingRow] = await Promise.all([
      MaintenanceRequest.count({ where: { assignedToId: user.id, stage: 'Repaired', ...completedDuringPeriod } }),
      MaintenanceRequest.count({ where: { assignedToId: user.id, stage: 'Repaired', rating: { [Op.ne]: null }, ...completedDuringPeriod } }),
      MaintenanceRequest.findOne({
        where: { assignedToId: user.id, stage: 'Repaired', rating: { [Op.ne]: null }, ...completedDuringPeriod },
        attributes: [[fn('AVG', col('rating')), 'avgRating']],
        raw: true
      })
    ]);

    payload.personal = {
      type: 'technician',
      solved,
      verifiedClosed,
      avgRating: Number(avgRatingRow?.avgRating || 0).toFixed(2)
    };
  } else {
    const [raisedTotal, awaitingVerification, verifiedClosed] = await Promise.all([
      MaintenanceRequest.count({ where: { createdById: user.id, ...createdDuringPeriod } }),
      MaintenanceRequest.count({ where: { createdById: user.id, stage: 'Repaired', rating: { [Op.is]: null }, ...completedDuringPeriod } }),
      MaintenanceRequest.count({ where: { createdById: user.id, stage: 'Repaired', rating: { [Op.ne]: null }, ...completedDuringPeriod } })
    ]);

    payload.personal = {
      type: 'user',
      raisedTotal,
      awaitingVerification,
      verifiedClosed
    };
  }

  return { data: payload };
};

exports.getRoleBasedReport = async (req, res) => {
  try {
    const period = req.query.month || req.query.year ? normalizeMonthYear(req.query.month, req.query.year) : null;
    if ((req.query.month || req.query.year) && !period) {
      return res.status(400).json({ success: false, message: 'Invalid month/year. Expected month=1..12 and year=2000..2100' });
    }

    const result = await buildRoleBasedPayload(req.user, period);
    if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
};

exports.exportRoleBasedReport = async (req, res) => {
  try {
    if (!['Admin', 'Manager'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Only admin and manager can export reports' });
    }

    const format = String(req.query.format || 'csv').trim().toLowerCase();
    const period = normalizeMonthYear(req.query.month, req.query.year);
    if (!period) {
      return res.status(400).json({ success: false, message: 'Invalid month/year. Expected month=1..12 and year=2000..2100' });
    }

    const result = await buildRoleBasedPayload(req.user, period);
    if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });

    const reportData = result.data;
    const fileBase = `gearguard-${reportData.scope || 'report'}-report-${period.label}`;

    if (format === 'csv') {
      const csv = [
        ['Scope', reportData.scope],
        ['Period', period.label],
        ['Generated At', reportData.generatedAt]
      ].map((row) => row.map(csvEscape).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
      return res.status(200).send(csv);
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
    doc.pipe(res);
    doc.fontSize(18).text('GearGuard Monthly Report');
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Scope: ${reportData.scope}`);
    doc.fontSize(10).text(`Period: ${period.label}`);
    doc.fontSize(10).text(`Generated At: ${reportData.generatedAt}`);
    doc.end();
    return;
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error exporting report', error: error.message });
  }
};

exports.getEquipmentAnalysis = async (req, res) => {
  try {
    const period = req.query.month || req.query.year ? normalizeMonthYear(req.query.month, req.query.year) : null;
    if ((req.query.month || req.query.year) && !period) {
      return res.status(400).json({ success: false, message: 'Invalid month/year. Expected month=1..12 and year=2000..2100' });
    }

    const equipmentId = Number(req.query.equipmentId);
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return res.status(400).json({ success: false, message: 'A valid equipmentId is required' });
    }

    const equipment = await Equipment.findByPk(equipmentId, { include: [{ model: Team, as: 'maintenanceTeam', attributes: ['id', 'name', 'specialization'] }] });
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const history = await MaintenanceRequest.findAll({
      where: { equipmentId, stage: 'Repaired', ...(period ? { completedDate: { [Op.between]: [period.startDate, period.endDate] } } : {}) },
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['completedDate', 'ASC']]
    });

    const toHours = (request) => {
      if (request?.duration !== null && request?.duration !== undefined && !Number.isNaN(Number(request.duration))) {
        return Number(request.duration);
      }

      const completedAt = request?.completedDate ? new Date(request.completedDate) : null;
      const startAt = request?.createdAt ? new Date(request.createdAt) : null;

      if (!completedAt || !startAt || Number.isNaN(completedAt.getTime()) || Number.isNaN(startAt.getTime())) {
        return null;
      }

      const diffMs = completedAt.getTime() - startAt.getTime();
      if (diffMs < 0) return null;
      return diffMs / 36e5;
    };

    const completedDates = history
      .map((item) => (item.completedDate ? new Date(item.completedDate) : null))
      .filter((date) => date && !Number.isNaN(date.getTime()));

    const repairDurations = history
      .map((item) => toHours(item))
      .filter((hours) => hours !== null && !Number.isNaN(hours));

    const totalRepairDurationHours = repairDurations.length > 0
      ? Number(repairDurations.reduce((sum, value) => sum + value, 0).toFixed(2))
      : 0;

    const avgRepairDurationHours = repairDurations.length > 0
      ? Number((totalRepairDurationHours / repairDurations.length).toFixed(2))
      : null;

    const daysBetweenRepairs = [];
    for (let i = 1; i < completedDates.length; i += 1) {
      const prev = completedDates[i - 1];
      const curr = completedDates[i];
      const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
      if (!Number.isNaN(diffDays) && diffDays >= 0) {
        daysBetweenRepairs.push(diffDays);
      }
    }

    const avgDaysBetweenRepairs = daysBetweenRepairs.length > 0
      ? Number((daysBetweenRepairs.reduce((sum, value) => sum + value, 0) / daysBetweenRepairs.length).toFixed(2))
      : null;

    const firstCompletedDate = completedDates.length > 0
      ? completedDates[0].toISOString()
      : null;

    const lastCompletedDate = completedDates.length > 0
      ? completedDates[completedDates.length - 1].toISOString()
      : null;

    const daysSinceLastRepair = lastCompletedDate
      ? Number((((Date.now() - new Date(lastCompletedDate).getTime()) / 86400000)).toFixed(2))
      : null;

    const historyPayload = history.map((item, index) => {
      const previous = index > 0 ? history[index - 1] : null;
      const previousCompleted = previous?.completedDate ? new Date(previous.completedDate) : null;
      const currentCompleted = item?.completedDate ? new Date(item.completedDate) : null;

      const daysSincePreviousRepair = previousCompleted && currentCompleted
        ? Number((((currentCompleted.getTime() - previousCompleted.getTime()) / 86400000)).toFixed(2))
        : null;

      return {
        requestId: item.id,
        requestNumber: item.requestNumber,
        completedDate: item.completedDate,
        repairDurationHours: toHours(item),
        daysSincePreviousRepair,
        technicianId: item.assignedTo?.id || null,
        technicianName: item.assignedTo?.name || 'Unassigned',
        rating: item.rating,
        feedback: item.feedback,
        completionNotes: item.completionNotes
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        equipment: {
          id: equipment.id,
          name: equipment.name,
          serialNumber: equipment.serialNumber,
          status: equipment.status,
          location: equipment.location,
          maintenanceTeam: equipment.maintenanceTeam
            ? {
                id: equipment.maintenanceTeam.id,
                name: equipment.maintenanceTeam.name,
                specialization: equipment.maintenanceTeam.specialization
              }
            : null
        },
        period: period ? { month: period.month, year: period.year, label: period.label } : null,
        summary: {
          repairCount: history.length,
          totalRepairDurationHours,
          avgRepairDurationHours,
          avgDaysBetweenRepairs,
          firstCompletedDate,
          lastCompletedDate,
          daysSinceLastRepair
        },
        history: historyPayload
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error generating equipment analysis', error: error.message });
  }
};