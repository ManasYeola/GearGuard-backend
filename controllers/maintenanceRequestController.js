const { MaintenanceRequest, Equipment, Team, User } = require('../models');
const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');

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
        }
      ]
    });
    
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
    
    request.stage = stage;
    
    // If moved to Repaired, set completed date
    if (stage === 'Repaired' && !request.completedDate) {
      request.completedDate = new Date();
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
    
    let where = { requestType: 'Preventive' };
    
    if (startDate && endDate) {
      where.scheduledDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
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
