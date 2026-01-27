const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');

// Get all maintenance requests
exports.getAllRequests = async (req, res) => {
  try {
    const { stage, requestType, team, assignedTo } = req.query;
    
    let filter = {};
    
    if (stage) filter.stage = stage;
    if (requestType) filter.requestType = requestType;
    if (team) filter.maintenanceTeam = team;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    const requests = await MaintenanceRequest.find(filter)
      .populate('equipment', 'name serialNumber category location')
      .populate('maintenanceTeam', 'name specialization')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
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
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('equipment', 'name serialNumber category location')
      .populate('maintenanceTeam', 'name specialization')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');
    
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
    const equipment = await Equipment.findById(equipmentId);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Auto-fill equipment category and maintenance team
    req.body.equipmentCategory = equipment.category;
    req.body.maintenanceTeam = equipment.maintenanceTeam;
    
    // If equipment has a default technician, assign it
    if (equipment.defaultTechnician && !req.body.assignedTo) {
      req.body.assignedTo = equipment.defaultTechnician;
    }
    
    const request = await MaintenanceRequest.create(req.body);
    
    await request.populate('equipment', 'name serialNumber category location');
    await request.populate('maintenanceTeam', 'name specialization');
    await request.populate('assignedTo', 'name email avatar');
    
    res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully',
      data: request
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
    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('equipment', 'name serialNumber category location')
      .populate('maintenanceTeam', 'name specialization')
      .populate('assignedTo', 'name email avatar');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Maintenance request updated successfully',
      data: request
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
    const request = await MaintenanceRequest.findById(req.params.id);
    
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
      const equipment = await Equipment.findById(request.equipment);
      if (equipment) {
        equipment.status = 'Scrapped';
        equipment.notes = (equipment.notes || '') + `\nScrapped on ${new Date().toISOString()} due to maintenance request ${request.requestNumber}`;
        await equipment.save();
      }
    }
    
    await request.save();
    
    await request.populate('equipment', 'name serialNumber category location');
    await request.populate('maintenanceTeam', 'name specialization');
    await request.populate('assignedTo', 'name email avatar');
    
    res.status(200).json({
      success: true,
      message: `Request moved to ${stage}`,
      data: request
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
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }
    
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
    
    let filter = {};
    if (team) filter.maintenanceTeam = team;
    
    const requests = await MaintenanceRequest.find(filter)
      .populate('equipment', 'name serialNumber')
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 });
    
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
    
    let filter = { requestType: 'Preventive' };
    
    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const requests = await MaintenanceRequest.find(filter)
      .populate('equipment', 'name serialNumber')
      .populate('assignedTo', 'name email avatar')
      .populate('maintenanceTeam', 'name')
      .sort({ scheduledDate: 1 });
    
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
    const byStage = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Requests by team
    const byTeam = await MaintenanceRequest.aggregate([
      {
        $lookup: {
          from: 'teams',
          localField: 'maintenanceTeam',
          foreignField: '_id',
          as: 'team'
        }
      },
      { $unwind: '$team' },
      {
        $group: {
          _id: '$team.name',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Requests by equipment category
    const byCategory = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$equipmentCategory',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Overdue requests
    const overdueCount = await MaintenanceRequest.countDocuments({ isOverdue: true });
    
    res.status(200).json({
      success: true,
      data: {
        byStage,
        byTeam,
        byCategory,
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
