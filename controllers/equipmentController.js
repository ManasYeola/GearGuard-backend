const { Equipment, MaintenanceRequest, Team, User } = require('../models');
const { Op, fn, col } = require('sequelize');

// Get all equipment
exports.getAllEquipment = async (req, res) => {
  try {
    const { department, category, status, ownershipType } = req.query;
    
    let where = { isActive: true };
    
    if (department) where.department = department;
    if (category) where.category = category;
    if (status) where.status = status;
    if (ownershipType) where.ownershipType = ownershipType;
    
    const equipment = await Equipment.findAll({
      where,
      include: [
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'defaultTechnician',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['name', 'ASC']]
    });
    
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
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'defaultTechnician',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
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
    // Handle assignedEmployee object conversion
    if (req.body.assignedEmployee) {
      req.body.assignedEmployeeName = req.body.assignedEmployee.name;
      req.body.assignedEmployeeEmail = req.body.assignedEmployee.email;
      delete req.body.assignedEmployee;
    }
    
    const equipment = await Equipment.create(req.body);
    
    const equipmentWithRelations = await Equipment.findByPk(equipment.id, {
      include: [
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'defaultTechnician',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: equipmentWithRelations
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
    const equipment = await Equipment.findByPk(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Handle assignedEmployee object conversion
    if (req.body.assignedEmployee) {
      req.body.assignedEmployeeName = req.body.assignedEmployee.name;
      req.body.assignedEmployeeEmail = req.body.assignedEmployee.email;
      delete req.body.assignedEmployee;
    }
    
    await equipment.update(req.body);
    
    const updatedEquipment = await Equipment.findByPk(equipment.id, {
      include: [
        {
          model: Team,
          as: 'maintenanceTeam',
          attributes: ['id', 'name', 'specialization']
        },
        {
          model: User,
          as: 'defaultTechnician',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      data: updatedEquipment
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
    const equipment = await Equipment.findByPk(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    await equipment.update({ isActive: false });
    
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
    const { status } = req.query;
    
    let where = { equipmentId: id };
    if (status) {
      where.stage = status;
    }
    
    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
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
      order: [['createdAt', 'DESC']]
    });
    
    // Count open requests (not Repaired or Scrapped)
    const openCount = await MaintenanceRequest.count({
      where: {
        equipmentId: id,
        stage: { [Op.notIn]: ['Repaired', 'Scrap'] }
      }
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
    const { groupBy } = req.query;
    
    if (groupBy !== 'department' && groupBy !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupBy parameter. Use "department" or "employee"'
      });
    }
    
    let groupField = groupBy === 'department' ? 'department' : 'assignedEmployeeName';
    
    const equipment = await Equipment.findAll({
      where: { isActive: true },
      attributes: [
        groupField,
        [fn('COUNT', col('id')), 'count']
      ],
      group: [groupField],
      order: [[groupField, 'ASC']]
    });
    
    // For detailed equipment list
    const detailedEquipment = await Equipment.findAll({
      where: { isActive: true },
      order: [[groupField, 'ASC']]
    });
    
    // Group manually for detailed response
    const grouped = {};
    detailedEquipment.forEach(eq => {
      const key = eq[groupField] || 'Unassigned';
      if (!grouped[key]) {
        grouped[key] = {
          _id: key,
          count: 0,
          equipment: []
        };
      }
      grouped[key].count++;
      grouped[key].equipment.push(eq);
    });
    
    res.status(200).json({
      success: true,
      data: Object.values(grouped)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error grouping equipment',
      error: error.message
    });
  }
};
