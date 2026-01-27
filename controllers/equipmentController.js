const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');

// Get all equipment
exports.getAllEquipment = async (req, res) => {
  try {
    const { department, category, status, ownershipType } = req.query;
    
    let filter = { isActive: true };
    
    if (department) filter.department = department;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (ownershipType) filter.ownershipType = ownershipType;
    
    const equipment = await Equipment.find(filter)
      .populate('maintenanceTeam', 'name specialization')
      .populate('defaultTechnician', 'name email avatar')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching equipment',
      error: error.message
    });
  }
};

// Get single equipment
exports.getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('maintenanceTeam', 'name specialization')
      .populate('defaultTechnician', 'name email avatar');
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching equipment',
      error: error.message
    });
  }
};

// Create equipment
exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    
    await equipment.populate('maintenanceTeam', 'name specialization');
    await equipment.populate('defaultTechnician', 'name email avatar');
    
    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: equipment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating equipment',
      error: error.message
    });
  }
};

// Update equipment
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('maintenanceTeam', 'name specialization')
      .populate('defaultTechnician', 'name email avatar');
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      data: equipment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating equipment',
      error: error.message
    });
  }
};

// Delete equipment (soft delete)
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting equipment',
      error: error.message
    });
  }
};

// Get maintenance requests for equipment (Smart Button)
exports.getEquipmentMaintenanceRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // Filter by status if needed
    
    let filter = { equipment: id };
    if (status) {
      filter.stage = status;
    }
    
    const requests = await MaintenanceRequest.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('maintenanceTeam', 'name')
      .sort({ createdAt: -1 });
    
    // Count open requests (not Repaired or Scrapped)
    const openCount = await MaintenanceRequest.countDocuments({
      equipment: id,
      stage: { $nin: ['Repaired', 'Scrap'] }
    });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      openCount: openCount,
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

// Group equipment by department or employee
exports.getEquipmentGrouped = async (req, res) => {
  try {
    const { groupBy } = req.query; // 'department' or 'employee'
    
    let groupField;
    if (groupBy === 'department') {
      groupField = '$department';
    } else if (groupBy === 'employee') {
      groupField = '$assignedEmployee.name';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupBy parameter. Use "department" or "employee"'
      });
    }
    
    const grouped = await Equipment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
          equipment: { $push: '$$ROOT' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error grouping equipment',
      error: error.message
    });
  }
};
