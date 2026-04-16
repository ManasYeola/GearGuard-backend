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
const PDFDocument = require('pdfkit');

const sumCounts = (items, key) =>
  (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Number(item?.[key] || 0), 0);

const normalizeMonthYear = (monthValue, yearValue) => {
  const now = new Date();
  const month = Number(monthValue || now.getMonth() + 1);
  const year = Number(yearValue || now.getFullYear());

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }

  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    month,
    year,
    startDate,
    endDate,
    label: `${year}-${String(month).padStart(2, '0')}`,
  };
};

const getCreatedWithinWhere = (period) => {
  if (!period) return {};

  return {
    createdAt: {
      [Op.between]: [period.startDate, period.endDate],
    },
  };
};

const getCompletedWithinWhere = (period) => {
  if (!period) return {};

  return {
    completedDate: {
      [Op.between]: [period.startDate, period.endDate],
    },
  };
};

const csvEscape = (value) => {
  const safe = String(value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
};

const buildCsvFromReport = (reportData) => {
  const lines = [];
  const scope = reportData?.scope || 'personal';
  const periodLabel = reportData?.period?.label || 'all-time';

  lines.push(['GearGuard Report', 'Value'].map(csvEscape).join(','));
  lines.push(['Scope', scope].map(csvEscape).join(','));
  lines.push(['Period', periodLabel].map(csvEscape).join(','));
  lines.push(['Generated At', reportData?.generatedAt || new Date().toISOString()].map(csvEscape).join(','));
  lines.push('');

  const summary = scope === 'global' ? reportData?.global?.summary : reportData?.team?.summary;
  if (summary) {
    lines.push(['Summary Metric', 'Count'].map(csvEscape).join(','));
    lines.push(['Repaired Equipments', summary.repairedEquipments].map(csvEscape).join(','));
    lines.push(['Repaired Requests', summary.repairedRequests].map(csvEscape).join(','));
    lines.push(['Requests Raised By Users', summary.requestsRaisedByUsers].map(csvEscape).join(','));
    lines.push(['Requests Solved By Technicians', summary.solvedByTechnicians].map(csvEscape).join(','));
    lines.push('');
  }

  if (scope === 'global') {
    const byTeam = reportData?.global?.byTeam || [];
    if (byTeam.length > 0) {
      lines.push(['Team Name', 'Repaired Equipments', 'Repaired Requests'].map(csvEscape).join(','));
      byTeam.forEach((item) => {
        lines.push([item.teamName, item.repairedEquipments, item.repairedRequests].map(csvEscape).join(','));
      });
      lines.push('');
    }
  }

  const byUser = (scope === 'global' ? reportData?.global?.byUser : reportData?.team?.byUser) || [];
  if (byUser.length > 0) {
    lines.push(['User Name', 'Role', 'Requests Raised'].map(csvEscape).join(','));
    byUser.forEach((item) => {
      lines.push([item.name, item.role, item.raisedCount].map(csvEscape).join(','));
    });
    lines.push('');
  }

  const byTechnician =
    (scope === 'global' ? reportData?.global?.byTechnician : reportData?.team?.byTechnician) || [];
  if (byTechnician.length > 0) {
    lines.push(['Technician Name', 'Requests Solved'].map(csvEscape).join(','));
    byTechnician.forEach((item) => {
      lines.push([item.name, item.solvedCount].map(csvEscape).join(','));
    });
    lines.push('');
  }

  return lines.join('\n');
};

const writePdfSectionTitle = (doc, title) => {
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor('#0f172a').text(title, { underline: true });
  doc.moveDown(0.3);
};

const writePdfKeyValues = (doc, rows) => {
  rows.forEach(({ label, value }) => {
    doc.fontSize(10).fillColor('#334155').text(`${label}: ${value ?? '-'}`);
  });
};

const sendPdfReport = (res, reportData, fileName) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  doc.pipe(res);
  doc.fontSize(18).fillColor('#0f172a').text('GearGuard Monthly Report');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#475569').text(`Scope: ${reportData?.scope || 'personal'}`);
  doc.fontSize(10).fillColor('#475569').text(`Period: ${reportData?.period?.label || 'all-time'}`);
  doc.fontSize(10).fillColor('#475569').text(`Generated At: ${reportData?.generatedAt || new Date().toISOString()}`);

  const summary = reportData?.scope === 'global' ? reportData?.global?.summary : reportData?.team?.summary;
  if (summary) {
    writePdfSectionTitle(doc, 'Summary');
    writePdfKeyValues(doc, [
      { label: 'Repaired Equipments', value: summary.repairedEquipments },
      { label: 'Repaired Requests', value: summary.repairedRequests },
      { label: 'Requests Raised By Users', value: summary.requestsRaisedByUsers },
      { label: 'Requests Solved By Technicians', value: summary.solvedByTechnicians },
    ]);
  }

  if (reportData?.scope === 'global') {
    const byTeam = reportData?.global?.byTeam || [];
    if (byTeam.length > 0) {
      writePdfSectionTitle(doc, 'Teams');
      byTeam.slice(0, 20).forEach((item) => {
        doc.fontSize(10).fillColor('#334155').text(
          `${item.teamName}: ${item.repairedRequests} solved requests, ${item.repairedEquipments} repaired equipments`
        );
      });
    }
  }

  const byTechnician =
    (reportData?.scope === 'global' ? reportData?.global?.byTechnician : reportData?.team?.byTechnician) || [];

  if (byTechnician.length > 0) {
    writePdfSectionTitle(doc, 'Technician Performance');
    byTechnician.slice(0, 30).forEach((item) => {
      doc.fontSize(10).fillColor('#334155').text(`${item.name}: ${item.solvedCount} solved requests`);
    });
  }

  doc.end();
};

const getRaisedByUsers = async (userWhere = {}, period = null) => {
  const rows = await MaintenanceRequest.findAll({
    attributes: ['createdById', [fn('COUNT', col('MaintenanceRequest.id')), 'raisedCount']],
    where: {
      ...getCreatedWithinWhere(period),
    },
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'name', 'role', 'teamId'],
        required: true,
        where: {
          isActive: true,
          ...userWhere,
        },
      },
    ],
    group: ['createdById', 'createdBy.id', 'createdBy.name', 'createdBy.role', 'createdBy.teamId'],
    order: [[fn('COUNT', col('MaintenanceRequest.id')), 'DESC']],
  });

  return rows.map((row) => ({
    userId: row.createdById,
    name: row.createdBy?.name || 'Unknown User',
    role: row.createdBy?.role || 'User',
    teamId: row.createdBy?.teamId || null,
    raisedCount: Number(row.dataValues.raisedCount || 0),
  }));
};

const getSolvedByTechnicians = async (userWhere = {}, period = null) => {
  const rows = await MaintenanceRequest.findAll({
    attributes: ['assignedToId', [fn('COUNT', col('MaintenanceRequest.id')), 'solvedCount']],
    where: {
      stage: 'Repaired',
      assignedToId: { [Op.not]: null },
      ...getCompletedWithinWhere(period),
    },
    include: [
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'name', 'role', 'teamId'],
        required: true,
        where: {
          isActive: true,
          role: 'Technician',
          ...userWhere,
        },
      },
    ],
    group: ['assignedToId', 'assignedTo.id', 'assignedTo.name', 'assignedTo.role', 'assignedTo.teamId'],
    order: [[fn('COUNT', col('MaintenanceRequest.id')), 'DESC']],
  });

  return rows.map((row) => ({
    technicianId: row.assignedToId,
    name: row.assignedTo?.name || 'Unknown Technician',
    teamId: row.assignedTo?.teamId || null,
    solvedCount: Number(row.dataValues.solvedCount || 0),
  }));
};

const getTeamSummary = async (teamId, period = null) => {
  const team = await Team.findByPk(teamId, {
    attributes: ['id', 'name', 'specialization'],
  });

  if (!team) {
    return null;
  }

  const repairedRequests = await MaintenanceRequest.count({
    where: {
      maintenanceTeamId: teamId,
      stage: 'Repaired',
      ...getCompletedWithinWhere(period),
    },
  });

  const repairedEquipments = await MaintenanceRequest.count({
    distinct: true,
    col: 'equipmentId',
    where: {
      maintenanceTeamId: teamId,
      stage: 'Repaired',
      ...getCompletedWithinWhere(period),
    },
  });

  const byUser = await getRaisedByUsers({ teamId }, period);
  const byTechnician = await getSolvedByTechnicians({ teamId }, period);

  return {
    team: {
      id: team.id,
      name: team.name,
      specialization: team.specialization,
    },
    summary: {
      repairedEquipments,
      repairedRequests,
      requestsRaisedByUsers: sumCounts(byUser, 'raisedCount'),
      solvedByTechnicians: sumCounts(byTechnician, 'solvedCount'),
    },
    byUser,
    byTechnician,
  };
};

const getGlobalSummary = async (period = null) => {
  const repairedRequests = await MaintenanceRequest.count({
    where: {
      stage: 'Repaired',
      ...getCompletedWithinWhere(period),
    },
  });

  const repairedEquipments = await MaintenanceRequest.count({
    distinct: true,
    col: 'equipmentId',
    where: {
      stage: 'Repaired',
      ...getCompletedWithinWhere(period),
    },
  });

  const byUser = await getRaisedByUsers({ role: 'User' }, period);
  const byTechnician = await getSolvedByTechnicians({}, period);

  const byTeamRows = await MaintenanceRequest.findAll({
    attributes: [
      'maintenanceTeamId',
      [fn('COUNT', col('MaintenanceRequest.id')), 'repairedRequests'],
      [fn('COUNT', fn('DISTINCT', col('MaintenanceRequest.equipmentId'))), 'repairedEquipments'],
    ],
    where: {
      stage: 'Repaired',
      maintenanceTeamId: { [Op.not]: null },
      ...getCompletedWithinWhere(period),
    },
    include: [
      {
        model: Team,
        as: 'maintenanceTeam',
        attributes: ['id', 'name'],
        required: true,
      },
    ],
    group: ['maintenanceTeamId', 'maintenanceTeam.id', 'maintenanceTeam.name'],
  });

  const byTeam = byTeamRows.map((row) => ({
    teamId: row.maintenanceTeamId,
    teamName: row.maintenanceTeam?.name || 'Unassigned',
    repairedRequests: Number(row.dataValues.repairedRequests || 0),
    repairedEquipments: Number(row.dataValues.repairedEquipments || 0),
  }));

  return {
    summary: {
      repairedEquipments,
      repairedRequests,
      requestsRaisedByUsers: sumCounts(byUser, 'raisedCount'),
      solvedByTechnicians: sumCounts(byTechnician, 'solvedCount'),
    },
    byTeam,
    byUser,
    byTechnician,
  };
};

const getPersonalSummary = async (user, period = null) => {
  if (!user) return null;

  if (user.role === 'Technician') {
    const assignedTotal = await MaintenanceRequest.count({
      where: {
        assignedToId: user.id,
        ...getCreatedWithinWhere(period),
      },
    });

    const solved = await MaintenanceRequest.count({
      where: {
        assignedToId: user.id,
        stage: 'Repaired',
        ...getCompletedWithinWhere(period),
      },
    });

    const verifiedClosed = await MaintenanceRequest.count({
      where: {
        assignedToId: user.id,
        stage: 'Repaired',
        rating: { [Op.not]: null },
        ...getCompletedWithinWhere(period),
      },
    });

    const inProgress = await MaintenanceRequest.count({
      where: {
        assignedToId: user.id,
        stage: 'In Progress',
        ...getCreatedWithinWhere(period),
      },
    });

    const avgRatingRow = await MaintenanceRequest.findOne({
      attributes: [[fn('AVG', col('rating')), 'avgRating']],
      where: {
        assignedToId: user.id,
        rating: { [Op.not]: null },
        ...getCompletedWithinWhere(period),
      },
      raw: true,
    });

    return {
      type: 'technician',
      assignedTotal,
      solved,
      verifiedClosed,
      inProgress,
      avgRating: Number(avgRatingRow?.avgRating || 0).toFixed(2),
    };
  }

  const raisedTotal = await MaintenanceRequest.count({
    where: {
      createdById: user.id,
      ...getCreatedWithinWhere(period),
    },
  });

  const open = await MaintenanceRequest.count({
    where: {
      createdById: user.id,
      stage: { [Op.in]: ['New', 'In Progress'] },
      ...getCreatedWithinWhere(period),
    },
  });

  const awaitingVerification = await MaintenanceRequest.count({
    where: {
      createdById: user.id,
      stage: 'Repaired',
      rating: { [Op.is]: null },
      ...getCompletedWithinWhere(period),
    },
  });

  const verifiedClosed = await MaintenanceRequest.count({
    where: {
      createdById: user.id,
      stage: 'Repaired',
      rating: { [Op.not]: null },
      ...getCompletedWithinWhere(period),
    },
  });

  return {
    type: user.role === 'Manager' ? 'manager' : 'user',
    raisedTotal,
    open,
    awaitingVerification,
    verifiedClosed,
  };
};

const buildEquipmentAnalysis = async ({ equipmentId, period = null }) => {
  const id = Number(equipmentId);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: { status: 400, message: 'A valid equipmentId is required' } };
  }

  const equipment = await Equipment.findByPk(id, {
    include: [
      {
        model: Team,
        as: 'maintenanceTeam',
        attributes: ['id', 'name', 'specialization'],
      },
      {
        model: User,
        as: 'defaultTechnician',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!equipment) {
    return { error: { status: 404, message: 'Equipment not found' } };
  }

  const repairedWhere = {
    equipmentId: id,
    stage: 'Repaired',
    completedDate: {
      [Op.not]: null,
      ...(period ? { [Op.between]: [period.startDate, period.endDate] } : {}),
    },
  };

  const repairedRequests = await MaintenanceRequest.findAll({
    where: repairedWhere,
    include: [
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: Team,
        as: 'maintenanceTeam',
        attributes: ['id', 'name'],
      },
    ],
    order: [['completedDate', 'ASC']],
  });

  const history = repairedRequests.map((request) => {
    const startDate = request.requestDate || request.createdAt;
    const endDate = request.completedDate || request.updatedAt;
    const repairDurationHours = Math.max((new Date(endDate) - new Date(startDate)) / 36e5, 0);

    return {
      requestId: request.id,
      requestNumber: request.requestNumber,
      completedDate: request.completedDate,
      repairDurationHours: Number(repairDurationHours.toFixed(2)),
      technicianName: request.assignedTo?.name || 'Unassigned',
      requesterName: request.createdBy?.name || 'Unknown',
      rating: request.rating ?? null,
      feedback: request.feedback || '',
    };
  });

  const durations = history.map((item) => item.repairDurationHours).filter((value) => Number.isFinite(value));
  const completedDates = repairedRequests
    .map((request) => new Date(request.completedDate))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  const timeBetweenRepairsDays = [];
  for (let index = 1; index < completedDates.length; index += 1) {
    const diffDays = (completedDates[index] - completedDates[index - 1]) / 86400000;
    timeBetweenRepairsDays.push(Number(diffDays.toFixed(2)));
  }

  const average = (values) => {
    if (!values.length) return null;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  };

  const lastCompletedDate = completedDates.length ? completedDates[completedDates.length - 1] : null;
  const firstCompletedDate = completedDates.length ? completedDates[0] : null;
  const daysSinceLastRepair = lastCompletedDate
    ? Number(((Date.now() - lastCompletedDate.getTime()) / 86400000).toFixed(2))
    : null;

  return {
    equipment: {
      id: equipment.id,
      name: equipment.name,
      serialNumber: equipment.serialNumber,
      category: equipment.category,
      location: equipment.location,
      status: equipment.status,
      maintenanceTeamId: equipment.maintenanceTeamId,
      maintenanceTeam: equipment.maintenanceTeam
        ? {
            id: equipment.maintenanceTeam.id,
            name: equipment.maintenanceTeam.name,
            specialization: equipment.maintenanceTeam.specialization,
          }
        : null,
    },
    period: period
      ? {
          month: period.month,
          year: period.year,
          label: period.label,
        }
      : null,
    summary: {
      repairCount: repairedRequests.length,
      avgRepairDurationHours: average(durations),
      totalRepairDurationHours: Number(durations.reduce((sum, value) => sum + value, 0).toFixed(2)),
      avgDaysBetweenRepairs: average(timeBetweenRepairsDays),
      daysSinceLastRepair,
      firstCompletedDate: firstCompletedDate ? firstCompletedDate.toISOString() : null,
      lastCompletedDate: lastCompletedDate ? lastCompletedDate.toISOString() : null,
    },
    history,
  };
};

const buildRoleBasedPayload = async (user, period = null) => {
  const role = user?.role;

  const payload = {
    role,
    generatedAt: new Date().toISOString(),
    scope: 'personal',
    period: period
      ? {
          month: period.month,
          year: period.year,
          label: period.label,
        }
      : null,
    personal: null,
    team: null,
    global: null,
  };

  if (!role) {
    return { error: { status: 401, message: 'Authentication required' } };
  }

  if (role === 'Admin') {
    payload.scope = 'global';
    payload.global = await getGlobalSummary(period);
    payload.personal = await getPersonalSummary(user, period);
    return { data: payload };
  }

  if (role === 'Manager') {
    if (!user.teamId) {
      return { error: { status: 400, message: 'Manager is not assigned to any team' } };
    }

    payload.scope = 'team';
    payload.personal = await getPersonalSummary(user, period);
    payload.team = await getTeamSummary(user.teamId, period);
    return { data: payload };
  }

  if (role === 'Technician' || role === 'User') {
    payload.scope = 'personal';
    payload.personal = await getPersonalSummary(user, period);
    return { data: payload };
  }

  return { error: { status: 403, message: 'Role not allowed to access reports' } };
};

const canAccessEquipmentAnalysis = async (user, equipment) => {
  if (!user || !equipment) return false;
  if (user.role === 'Admin') return true;
  if (user.role === 'Manager') return user.teamId && user.teamId === equipment.maintenanceTeamId;
  return true;
};

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

// Role-aware reports: personal for users/technicians, team for managers, all for admin.
exports.getRoleBasedReport = async (req, res) => {
  try {
    const period =
      req.query.month || req.query.year ? normalizeMonthYear(req.query.month, req.query.year) : null;

    if ((req.query.month || req.query.year) && !period) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month/year. Expected month=1..12 and year=2000..2100',
      });
    }

    const reportResult = await buildRoleBasedPayload(req.user, period);
    if (reportResult.error) {
      return res.status(reportResult.error.status).json({
        success: false,
        message: reportResult.error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: reportResult.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message,
    });
  }
};

// Export report (CSV/PDF) - admin and manager only
exports.exportRoleBasedReport = async (req, res) => {
  try {
    if (!['Admin', 'Manager'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admin and manager can export reports',
      });
    }

    const format = String(req.query.format || 'csv').trim().toLowerCase();
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported format. Use format=csv or format=pdf',
      });
    }

    const period = normalizeMonthYear(req.query.month, req.query.year);
    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month/year. Expected month=1..12 and year=2000..2100',
      });
    }

    const reportResult = await buildRoleBasedPayload(req.user, period);
    if (reportResult.error) {
      return res.status(reportResult.error.status).json({
        success: false,
        message: reportResult.error.message,
      });
    }

    const reportData = reportResult.data;
    const scope = reportData.scope || 'report';
    const fileBase = `gearguard-${scope}-report-${period.label}`;

    if (format === 'csv') {
      const csvText = buildCsvFromReport(reportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
      return res.status(200).send(csvText);
    }

    return sendPdfReport(res, reportData, `${fileBase}.pdf`);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message,
    });
  }
};

// Equipment analysis (repair duration, interval between repairs, and repair history)
exports.getEquipmentAnalysis = async (req, res) => {
  try {
    const period =
      req.query.month || req.query.year ? normalizeMonthYear(req.query.month, req.query.year) : null;

    if ((req.query.month || req.query.year) && !period) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month/year. Expected month=1..12 and year=2000..2100',
      });
    }

    const equipmentId = req.query.equipmentId;
    const result = await buildEquipmentAnalysis({ equipmentId, period });

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    if (!(await canAccessEquipmentAnalysis(req.user, result.equipment))) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to view analysis for this equipment',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error generating equipment analysis',
      error: error.message,
    });
  }
};
