const { MaintenanceRequest, Equipment, Team, User } = require('../models');
const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const NotificationService = require('../services/notificationService');

const normalizeRequestType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (['preventive', 'preventive maintenance', 'inspection', 'scheduled'].includes(normalized)) {
    return 'Preventive';
  }

  return 'Corrective';
};

const notifySafely = (handler, context) => {
  Promise.resolve()
    .then(() => handler())
    .catch((error) => {
      console.warn(`[Notification] ${context} failed:`, error.message);
    });
};

const notifyAdminsAndManagersForNewRequest = async (request, equipment) => {
  try {
    const reviewers = await User.findAll({
      where: {
        role: { [Op.in]: ['Admin', 'Manager'] },
        isActive: true,
      },
      attributes: ['id', 'name', 'email'],
    });

    reviewers.forEach((reviewer) => {
      notifySafely(() => NotificationService.notifyNewRequest(reviewer, request, equipment), 'new-request');
    });
  } catch (error) {
    console.warn('[Notification] reviewer lookup failed:', error.message);
  }
};

const notifyStatusRecipients = async ({ request, oldStage, newStage }) => {
  if (!request || oldStage === newStage) return;

  try {
    const recipients = [];
    if (request.createdById) {
      const requester = await User.findByPk(request.createdById, {
        attributes: ['id', 'name', 'email', 'isActive'],
      });
      if (requester?.isActive) {
        recipients.push(requester);
      }
    }

    if (request.assignedToId && request.assignedToId !== request.createdById) {
      const assignee = await User.findByPk(request.assignedToId, {
        attributes: ['id', 'name', 'email', 'isActive'],
      });
      if (assignee?.isActive) {
        recipients.push(assignee);
      }
    }

    recipients.forEach((recipient) => {
      notifySafely(
        () => NotificationService.notifyStatusChange(recipient, request, oldStage, newStage),
        'status-change'
      );
    });
  } catch (error) {
    console.warn('[Notification] status recipient lookup failed:', error.message);
  }
};

const isRequesterOrAdmin = (request, user) => {
  if (!request || !user) return false;
  return user.role === 'Admin' || request.createdById === user.id;
};

// Get all maintenance requests
exports.getAllRequests = async (req, res) => {
  try {
    const { stage, requestType, team, assignedTo } = req.query;
    
    let where = {};
    
    if (stage) where.stage = stage;
    if (requestType) where.requestType = requestType;
    if (team) where.maintenanceTeamId = team;
    if (assignedTo) where.assignedToId = assignedTo;
    
    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category', 'location']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance requests',
      error: error.message
    });
  }
};

// Get single request
exports.getRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category', 'location']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance request',
      error: error.message
    });
  }
};

// Create maintenance request with auto-fill logic
exports.createRequest = async (req, res) => {
  try {
    const { equipment: equipmentId } = req.body;
    
    // Fetch equipment to auto-fill category and team
    const equipment = await Equipment.findByPk(equipmentId);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Auto-fill equipment category and maintenance team
    req.body.equipmentId = equipmentId;
    req.body.equipmentCategory = equipment.category;
    req.body.maintenanceTeamId = equipment.maintenanceTeamId;
    req.body.requestType = normalizeRequestType(req.body.requestType);

    // Default creator to currently authenticated user if available.
    if (!req.body.createdById && req.user?.id) {
      req.body.createdById = req.user.id;
    }
    
    // If equipment has a default technician, assign it
    if (equipment.defaultTechnicianId && !req.body.assignedTo) {
      req.body.assignedToId = equipment.defaultTechnicianId;
    }
    
    // Remove old field names if present
    delete req.body.equipment;
    delete req.body.maintenanceTeam;
    delete req.body.assignedTo;
    delete req.body.createdBy;
    
    // Validate createdById if provided; drop invalid values to avoid FK errors.
    if (req.body.createdById !== undefined && req.body.createdById !== null) {
      const creator = await User.findByPk(req.body.createdById);
      if (!creator) {
        delete req.body.createdById;
      }
    }
    
    const request = await MaintenanceRequest.create(req.body);
    
    const requestWithRelations = await MaintenanceRequest.findByPk(request.id, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category', 'location']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    await notifyAdminsAndManagersForNewRequest(requestWithRelations, equipment);

    if (requestWithRelations?.assignedTo) {
      notifySafely(
        () =>
          NotificationService.notifyTechnicianAssigned(
            requestWithRelations.assignedTo,
            requestWithRelations,
            equipment,
            requestWithRelations.scheduledDate || 'Not scheduled yet'
          ),
        'auto-assignment'
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully',
      data: requestWithRelations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating maintenance request',
      error: error.message
    });
  }
};

// Update maintenance request
exports.updateRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    await request.update(req.body);
    
    const updatedRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category', 'location']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'Maintenance request updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating maintenance request',
      error: error.message
    });
  }
};

// Update request stage (for Kanban board)
exports.updateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const request = await MaintenanceRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    const oldStage = request.stage;
    request.stage = stage;
    
    // If moved to Repaired, set completed date
    if (stage === 'Repaired' && !request.completedDate) {
      request.completedDate = new Date();
      request.rating = null;
      request.feedback = '';
    }

    // Reopened requests should go through verification again after repair.
    if (stage === 'In Progress' && oldStage === 'Repaired') {
      request.completedDate = null;
      request.rating = null;
      request.feedback = '';
    }
    
    // If moved to Scrap, mark equipment status and log
    if (stage === 'Scrap') {
      const equipment = await Equipment.findByPk(request.equipmentId);
      if (equipment) {
        equipment.status = 'Scrapped';
        equipment.notes = (equipment.notes || '') + `\nScrapped on ${new Date().toISOString()} due to maintenance request ${request.requestNumber}`;
        await equipment.save();
      }
    }
    
    await request.save();

    await notifyStatusRecipients({
      request,
      oldStage,
      newStage: stage,
    });
    
    const updatedRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category', 'location']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (
      oldStage !== 'Repaired' &&
      stage === 'Repaired' &&
      updatedRequest?.createdBy &&
      updatedRequest?.assignedTo &&
      updatedRequest?.equipment
    ) {
      notifySafely(
        () =>
          NotificationService.notifyRequestCompleted(
            updatedRequest.createdBy,
            updatedRequest.assignedTo,
            updatedRequest,
            updatedRequest.equipment
          ),
        'request-completed-stage-update'
      );
    }
    
    res.status(200).json({
      success: true,
      message: `Request moved to ${stage}`,
      data: updatedRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating request stage',
      error: error.message
    });
  }
};

// Delete request
exports.deleteRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    await request.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Maintenance request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting maintenance request',
      error: error.message
    });
  }
};

// Get requests for Kanban view (grouped by stage)
exports.getKanbanView = async (req, res) => {
  try {
    const { team } = req.query;
    
    let where = {};
    if (team) where.maintenanceTeamId = team;

    // Technicians can only see requests assigned to them.
    if (req.user?.role === 'Technician') {
      where.assignedToId = req.user.id;
    }
    
    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Group by stage
    const kanban = {
      New: requests.filter(r => r.stage === 'New'),
      'In Progress': requests.filter(r => r.stage === 'In Progress'),
      Repaired: requests.filter(r => r.stage === 'Repaired'),
      Scrap: requests.filter(r => r.stage === 'Scrap')
    };
    
    res.status(200).json({
      success: true,
      data: kanban
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Kanban view',
      error: error.message
    });
  }
};

// Get calendar view (scheduled preventive maintenance)
exports.getCalendarView = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let where = {
      scheduledDate: {
        [Op.not]: null
      }
    };
    
    if (startDate && endDate) {
      where.scheduledDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Role-aware visibility for calendar data.
    if (req.user?.role === 'Technician') {
      where.assignedToId = req.user.id;
    } else if (req.user?.role === 'User') {
      where.createdById = req.user.id;
    }
    
    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name']
        }
      ],
      order: [['scheduledDate', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar view',
      error: error.message
    });
  }
};

// Get statistics/reports
exports.getStatistics = async (req, res) => {
  try {
    // Requests by stage
    const byStage = await MaintenanceRequest.findAll({
      attributes: [
        'stage',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['stage']
    });
    
    // Requests by team
    const byTeam = await MaintenanceRequest.findAll({
      attributes: [
        [fn('COUNT', col('MaintenanceRequest.id')), 'count']
      ],
      include: [
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['name']
        }
      ],
      group: ['maintenanceTeam.id', 'maintenanceTeam.name']
    });
    
    // Requests by equipment category
    const byCategory = await MaintenanceRequest.findAll({
      attributes: [
        'equipmentCategory',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['equipmentCategory']
    });
    
    // Overdue requests
    const overdueCount = await MaintenanceRequest.count({
      where: { isOverdue: true }
    });
    
    // Format the results
    const formattedByStage = byStage.map(item => ({
      _id: item.stage,
      count: parseInt(item.dataValues.count)
    }));
    
    const formattedByTeam = byTeam.map(item => ({
      _id: item.maintenanceTeam?.name || 'Unassigned',
      count: parseInt(item.dataValues.count)
    }));
    
    const formattedByCategory = byCategory.map(item => ({
      _id: item.equipmentCategory,
      count: parseInt(item.dataValues.count)
    }));
    
    res.status(200).json({
      success: true,
      data: {
        byStage: formattedByStage,
        byTeam: formattedByTeam,
        byCategory: formattedByCategory,
        overdueCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// ── Get requests created by the logged-in user ────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.findAll({
      where: { createdById: req.user.id },
      include: [
        { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serialNumber', 'category', 'location'] },
        { model: Team,      as: 'maintenanceTeam', attributes: ['id', 'name', 'specialization'] },
        { model: User,      as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching your requests', error: error.message });
  }
};

// ── Assign technician (Admin / Manager) ───────────────────────────────────────
exports.assignTechnician = async (req, res) => {
  try {
    const { assignedToId, scheduledDate, maintenanceTeamId } = req.body;
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (assignedToId) {
      const tech = await User.findByPk(assignedToId);
      if (!tech) return res.status(400).json({ success: false, message: 'Technician not found' });
      request.assignedToId = assignedToId;
    }
    if (scheduledDate)     request.scheduledDate    = scheduledDate;
    if (maintenanceTeamId) request.maintenanceTeamId = maintenanceTeamId;
    await request.save();

    const updated = await MaintenanceRequest.findByPk(request.id, {
      include: [
        { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serialNumber'] },
        { model: User,      as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: Team,      as: 'maintenanceTeam', attributes: ['id', 'name'] }
      ]
    });
    res.status(200).json({ success: true, message: 'Technician assigned', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error assigning technician', error: error.message });
  }
};

// ── Start work (assigned Technician or Admin/Manager) ─────────────────────────
exports.startWork = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.stage !== 'New') {
      return res.status(400).json({ success: false, message: `Request is already "${request.stage}"` });
    }
    const isPrivileged = ['Admin', 'Manager'].includes(req.user.role);
    if (!isPrivileged && request.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this request' });
    }
    request.stage = 'In Progress';
    await request.save();
    res.status(200).json({ success: true, message: 'Work started — request is now In Progress', data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error starting work', error: error.message });
  }
};

// ── Add work notes (assignedTo or Admin/Manager) ──────────────────────────────
exports.addNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Notes cannot be empty' });
    }
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    request.notes = request.notes
      ? `${request.notes}\n\n[${ts}] ${notes.trim()}`
      : `[${ts}] ${notes.trim()}`;
    await request.save();
    res.status(200).json({ success: true, message: 'Notes saved', data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding notes', error: error.message });
  }
};

// ── Complete request (assignedTo or Admin/Manager) ────────────────────────────
// Assign technician to request (Admin only)
exports.assignTechnician = async (req, res) => {
  try {
    const { assignedToId, scheduledDate } = req.body;
    const request = await MaintenanceRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    // Verify technician exists
    const technician = await User.findByPk(assignedToId);
    if (!technician || technician.role !== 'Technician') {
      return res.status(404).json({
        success: false,
        message: 'Invalid technician or user is not a technician'
      });
    }
    
    const oldStage = request.stage;
    request.assignedToId = assignedToId;
    if (scheduledDate) {
      request.scheduledDate = scheduledDate;
    }
    request.stage = 'In Progress'; // Auto-move to In Progress when assigned
    await request.save();
    
    const updatedRequest = await MaintenanceRequest.findByPk(request.id, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (updatedRequest?.assignedTo && updatedRequest?.equipment) {
      notifySafely(
        () =>
          NotificationService.notifyTechnicianAssigned(
            updatedRequest.assignedTo,
            updatedRequest,
            updatedRequest.equipment,
            updatedRequest.scheduledDate || 'Not scheduled yet'
          ),
        'assign-technician'
      );
    }

    await notifyStatusRecipients({
      request,
      oldStage,
      newStage: request.stage,
    });
    
    res.status(200).json({
      success: true,
      message: 'Technician assigned successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error assigning technician',
      error: error.message
    });
  }
};

// Start work on request (Technician)
exports.startWork = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    if (request.assignedToId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this request'
      });
    }
    
    const oldStage = request.stage;
    request.stage = 'In Progress';
    request.startTime = new Date();
    request.isActive = true;
    await request.save();

    await notifyStatusRecipients({
      request,
      oldStage,
      newStage: request.stage,
    });
    
    res.status(200).json({
      success: true,
      message: 'Work started on request',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error starting work',
      error: error.message
    });
  }
};

// Add work notes (Technician)
exports.addWorkNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const request = await MaintenanceRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    if (request.assignedToId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this request'
      });
    }
    
    request.workNotes = (request.workNotes || '') + `\n[${new Date().toISOString()}] ${notes}`;
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Work notes added',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding work notes',
      error: error.message
    });
  }
};

// Complete request (Technician)
exports.completeRequest = async (req, res) => {
  try {
    const { actualCost, completionNotes } = req.body;
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (['Repaired', 'Scrap'].includes(request.stage)) {
      return res.status(400).json({ success: false, message: `Request is already "${request.stage}"` });
    }
    const isPrivileged = ['Admin', 'Manager'].includes(req.user.role);
    if (!isPrivileged && request.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this request' });
    }
    request.stage         = 'Repaired';
    request.completedDate = new Date();
    if (actualCost     !== undefined) request.actualCost     = actualCost;
    if (completionNotes)              request.completionNotes = completionNotes.trim();
    await request.save();

    const updated = await MaintenanceRequest.findByPk(request.id, {
      include: [
        { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serialNumber'] },
        { model: User,      as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.status(200).json({ success: true, message: 'Request completed successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error completing request', error: error.message });
  }
};

// ── Rate service (original requester or Admin) ────────────────────────────────
exports.rateService = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.stage !== 'Repaired') {
      return res.status(400).json({ success: false, message: 'Only completed (Repaired) requests can be rated' });
    }
    if (request.rating) {
      return res.status(400).json({ success: false, message: 'This request has already been rated' });
    }
    if (req.user.role !== 'Admin' && request.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the original requester can rate this service' });
    }
    request.rating   = rating;
    request.feedback = feedback ? feedback.trim() : null;
    await request.save();
    res.status(200).json({ success: true, message: 'Thank you for your feedback!', data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error rating service', error: error.message });
  }
};

// Backward-compatible alias for newer routes.
exports.verifyRequest = exports.rateService;

// Get my requests (for technician or employee)
exports.getMyRequests = async (req, res) => {
  try {
    let where = {};
    
    if (req.user.role === 'Technician') {
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'User') {  // Employee
      where.createdById = req.user.id;
    }
    
    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'serialNumber', 'category']
        },
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};
